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

const (
	BATCH_SIZE = 1000 // 每批处理的记录数
)

func main() {
	// 1. 初始化GORM连接
	dsn := "root:CyberSec@1234@tcp(10.10.10.23:3306)/epdis?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}

	// 2. 读取CSV文件
	file, err := os.Open("epss_scores-2025-07-29.csv")
	if err != nil {
		log.Fatal("无法打开CSV文件:", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1 // 禁用字段数量检查
	reader.LazyQuotes = true    // 允许非标准引号
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatal("CSV读取失败:", err)
	}

	// 3. 数据预处理
	var validRecords []VulnIntelligence
	invalidCount := 0

	for i, row := range records {
		// 跳过标题行和空行
		if i == 0 || len(row) < 2 {
			continue
		}

		cve := strings.TrimSpace(strings.ToUpper(row[0]))
		epss := strings.TrimSpace(row[1])

		// 验证数据格式
		if !strings.HasPrefix(cve, "CVE-") {
			log.Printf("⚠️ 行 %d 无效CVE格式: %s\n", i+1, cve)
			invalidCount++
			continue
		}

		validRecords = append(validRecords, VulnIntelligence{
			CVE:  cve,
			EPSS: epss,
		})
	}

	log.Printf("📋 数据预处理完成: 有效记录 %d 条, 无效记录 %d 条\n", len(validRecords), invalidCount)

	// 4. 高性能批量处理
	startTime := time.Now()
	successCount := 0
	failCount := 0

	// 分批处理
	for i := 0; i < len(validRecords); i += BATCH_SIZE {
		end := i + BATCH_SIZE
		if end > len(validRecords) {
			end = len(validRecords)
		}

		batch := validRecords[i:end]
		log.Printf("🔄 处理批次 %d-%d (共 %d 条记录)...", i+1, end, len(batch))

		// 使用原生SQL批量更新 (性能最优)
		err := batchUpdateWithRawSQL(db, batch)
		if err != nil {
			log.Printf("❌ 批次处理失败: %v\n", err)
			failCount += len(batch)
			continue
		}

		successCount += len(batch)
		log.Printf("✅ 批次 %d-%d 完成\n", i+1, end)
	}

	// 5. 输出统计
	duration := time.Since(startTime)
	log.Printf(`
🎉 任务完成！
====================
总处理行数: %d
有效记录: %d
成功更新: %d
跳过/失败: %d
处理耗时: %v
平均速度: %.2f 条/秒
`, len(records)-1, len(validRecords), successCount, failCount+invalidCount, duration, float64(len(validRecords))/duration.Seconds())
}

// 高性能批量更新函数
func batchUpdateWithRawSQL(db *gorm.DB, records []VulnIntelligence) error {
	if len(records) == 0 {
		return nil
	}

	// 构建批量更新SQL
	var cases []string
	var cveList []string
	var args []interface{}

	for _, record := range records {
		cases = append(cases, "WHEN ? THEN ?")
		cveList = append(cveList, "?")
		args = append(args, record.CVE, record.EPSS, record.CVE)
	}

	// 构建完整的SQL语句
	sql := `UPDATE vuln_intnelligence 
			SET epss = CASE cve 
			` + strings.Join(cases, " ") + `
			END 
			WHERE cve IN (` + strings.Join(cveList, ",") + `)`

	// 执行批量更新
	result := db.Exec(sql, args...)
	return result.Error
}

// 方案3: 使用INSERT ... ON DUPLICATE KEY UPDATE (MySQL特有，性能极佳)
func batchUpsertWithMySQL(db *gorm.DB, records []VulnIntelligence) error {
	if len(records) == 0 {
		return nil
	}

	// 构建批量插入SQL
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