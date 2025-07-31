package main

import (
	"encoding/csv"
	"log"
	"os"
	"strings"

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

	// 3. 处理数据
	successCount := 0
	failCount := 0

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
			failCount++
			continue
		}

		// 4. 使用GORM更新
		result := db.Model(&VulnIntelligence{}).
			Where("cve = ?", cve).
			Update("epss", epss)

		if result.Error != nil {
			log.Printf("❌ 更新失败 [%s]: %v\n", cve, result.Error)
			failCount++
			continue
		}

		if result.RowsAffected > 0 {
			log.Printf("✅ 成功更新 [%s] => %s (影响 %d 行)\n", cve, epss, result.RowsAffected)
			successCount++
		} else {
			log.Printf("⏩ 无需更新 [%s] (值未变化或记录不存在)\n", cve)
		}

		// 进度提示
		if (i+1)%100 == 0 {
			log.Printf("\n📊 进度: 已处理 %d 行 | 成功 %d 条 | 失败 %d 条\n", i+1, successCount, failCount)
		}
	}

	// 5. 输出统计
	log.Printf(`
🎉 任务完成！
====================
总处理行数: %d
成功更新: %d
跳过/失败: %d
`, len(records)-1, successCount, failCount)
}
