package main

import (
	"encoding/csv"
	"log"
	"os"
	"strings"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type VulnIntelligence struct {
	CVE  string `gorm:"column:cve;primaryKey"`
	EPSS string `gorm:"column:epss"`
}

func (VulnIntelligence) TableName() string {
	return "vuln_intnelligence"
}

// 性能测试配置
const (
	SMALL_BATCH  = 100
	MEDIUM_BATCH = 500
	LARGE_BATCH  = 1000
	HUGE_BATCH   = 2000
)

func main() {
	// 初始化数据库连接
	dsn := "root:CyberSec@1234@tcp(10.10.10.23:3306)/epdis?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}

	// 读取测试数据
	records := loadTestData()
	log.Printf("📊 加载测试数据: %d 条记录\n", len(records))

	// 性能测试
	testBatchSizes := []int{SMALL_BATCH, MEDIUM_BATCH, LARGE_BATCH, HUGE_BATCH}
	
	for _, batchSize := range testBatchSizes {
		log.Printf("\n🔬 测试批次大小: %d\n", batchSize)
		log.Printf("=" + strings.Repeat("=", 50))
		
		// 测试方案1: GORM事务批量更新
		testGormTransaction(db, records, batchSize)
		
		// 测试方案2: 原生SQL批量更新
		testRawSQLBatchUpdate(db, records, batchSize)
		
		// 测试方案3: MySQL UPSERT
		testMySQLUpsert(db, records, batchSize)
	}
}

func loadTestData() []VulnIntelligence {
	file, err := os.Open("epss_scores-2025-07-29.csv")
	if err != nil {
		log.Fatal("无法打开CSV文件:", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1
	reader.LazyQuotes = true
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatal("CSV读取失败:", err)
	}

	var validRecords []VulnIntelligence
	for i, row := range records {
		if i == 0 || len(row) < 2 {
			continue
		}

		cve := strings.TrimSpace(strings.ToUpper(row[0]))
		epss := strings.TrimSpace(row[1])

		if !strings.HasPrefix(cve, "CVE-") {
			continue
		}

		validRecords = append(validRecords, VulnIntelligence{
			CVE:  cve,
			EPSS: epss,
		})
	}

	return validRecords
}

// 方案1: GORM事务批量更新
func testGormTransaction(db *gorm.DB, records []VulnIntelligence, batchSize int) {
	startTime := time.Now()
	successCount := 0

	for i := 0; i < len(records); i += batchSize {
		end := i + batchSize
		if end > len(records) {
			end = len(records)
		}

		batch := records[i:end]
		err := db.Transaction(func(tx *gorm.DB) error {
			for _, record := range batch {
				result := tx.Model(&VulnIntelligence{}).
					Where("cve = ?", record.CVE).
					Update("epss", record.EPSS)

				if result.Error != nil {
					return result.Error
				}
				successCount++
			}
			return nil
		})

		if err != nil {
			log.Printf("❌ GORM事务失败: %v\n", err)
			return
		}
	}

	duration := time.Since(startTime)
	log.Printf("📈 GORM事务批量更新:")
	log.Printf("   成功: %d 条")
	log.Printf("   耗时: %v")
	log.Printf("   速度: %.2f 条/秒\n", successCount, duration, float64(successCount)/duration.Seconds())
}

// 方案2: 原生SQL批量更新
func testRawSQLBatchUpdate(db *gorm.DB, records []VulnIntelligence, batchSize int) {
	startTime := time.Now()
	successCount := 0

	for i := 0; i < len(records); i += batchSize {
		end := i + batchSize
		if end > len(records) {
			end = len(records)
		}

		batch := records[i:end]
		err := batchUpdateWithRawSQL(db, batch)
		if err != nil {
			log.Printf("❌ 原生SQL批量更新失败: %v\n", err)
			return
		}
		successCount += len(batch)
	}

	duration := time.Since(startTime)
	log.Printf("📈 原生SQL批量更新:")
	log.Printf("   成功: %d 条")
	log.Printf("   耗时: %v")
	log.Printf("   速度: %.2f 条/秒\n", successCount, duration, float64(successCount)/duration.Seconds())
}

// 方案3: MySQL UPSERT
func testMySQLUpsert(db *gorm.DB, records []VulnIntelligence, batchSize int) {
	startTime := time.Now()
	successCount := 0

	for i := 0; i < len(records); i += batchSize {
		end := i + batchSize
		if end > len(records) {
			end = len(records)
		}

		batch := records[i:end]
		err := batchUpsertWithMySQL(db, batch)
		if err != nil {
			log.Printf("❌ MySQL UPSERT失败: %v\n", err)
			return
		}
		successCount += len(batch)
	}

	duration := time.Since(startTime)
	log.Printf("📈 MySQL UPSERT:")
	log.Printf("   成功: %d 条")
	log.Printf("   耗时: %v")
	log.Printf("   速度: %.2f 条/秒\n", successCount, duration, float64(successCount)/duration.Seconds())
}

func batchUpdateWithRawSQL(db *gorm.DB, records []VulnIntelligence) error {
	if len(records) == 0 {
		return nil
	}

	var cases []string
	var cveList []string
	var args []interface{}

	for _, record := range records {
		cases = append(cases, "WHEN ? THEN ?")
		cveList = append(cveList, "?")
		args = append(args, record.CVE, record.EPSS, record.CVE)
	}

	sql := `UPDATE vuln_intnelligence 
			SET epss = CASE cve 
			` + strings.Join(cases, " ") + `
			END 
			WHERE cve IN (` + strings.Join(cveList, ",") + `)`

	result := db.Exec(sql, args...)
	return result.Error
}

func batchUpsertWithMySQL(db *gorm.DB, records []VulnIntelligence) error {
	if len(records) == 0 {
		return nil
	}

	var values []string
	var args []interface{}

	for _, record := range records {
		values = append(values, "(?, ?)")
		args = append(args, record.CVE, record.EPSS)
	}

	sql := `INSERT INTO vuln_intnelligence (cve, epss) VALUES ` + 
		   strings.Join(values, ", ") + 
		   ` ON DUPLICATE KEY UPDATE epss = VALUES(epss)`

	result := db.Exec(sql, args...)
	return result.Error
} 