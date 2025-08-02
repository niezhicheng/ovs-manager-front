package main

import (
	"fmt"
	"gorm.io/gorm"
)

/*
* 聚合统计唯一子域名数量（修复版本）
 */

// 方法1：使用Count()方法（推荐）
func AggDomainCount1() (int, error) {
	var count int64
	// 使用Distinct() + Count()组合
	err := databases.Db.Table("asset_info").
		Distinct("asset_domain_name").
		Count(&count).Error

	if err != nil {
		fmt.Println("这里有报错", err.Error())
		common.WriteError(fmt.Sprintf("聚合子域名错误: %v", err))
		return 0, err
	}
	return int(count), nil
}

// 方法2：使用结构体接收Scan结果
func AggDomainCount2() (int, error) {
	type Result struct {
		Count int64 `json:"count"`
	}
	
	var result Result
	err := databases.Db.Table("asset_info").
		Select("COUNT(DISTINCT asset_domain_name) as count").
		Scan(&result).Error

	if err != nil {
		fmt.Println("这里有报错", err.Error())
		common.WriteError(fmt.Sprintf("聚合子域名错误: %v", err))
		return 0, err
	}
	return int(result.Count), nil
}

// 方法3：使用map接收Scan结果
func AggDomainCount3() (int, error) {
	var result map[string]interface{}
	err := databases.Db.Table("asset_info").
		Select("COUNT(DISTINCT asset_domain_name) as count").
		Scan(&result).Error

	if err != nil {
		fmt.Println("这里有报错", err.Error())
		common.WriteError(fmt.Sprintf("聚合子域名错误: %v", err))
		return 0, err
	}
	
	// 类型断言
	if count, ok := result["count"].(int64); ok {
		return int(count), nil
	}
	return 0, fmt.Errorf("无法获取计数结果")
}

// 方法4：使用原生SQL（最直接）
func AggDomainCount4() (int, error) {
	var count int64
	err := databases.Db.Raw("SELECT COUNT(DISTINCT asset_domain_name) FROM asset_info").
		Scan(&count).Error

	if err != nil {
		fmt.Println("这里有报错", err.Error())
		common.WriteError(fmt.Sprintf("聚合子域名错误: %v", err))
		return 0, err
	}
	return int(count), nil
}

/*
* 查询唯一映射IP的数量（修复版本）
 */

// 方法1：使用Count()方法（推荐）
func QueryTransferIpCount1() (int, error) {
	var count int64
	// 使用Distinct() + Count()组合
	err := databases.Db.Table("network_nat_policies").
		Distinct("transfer_ip").
		Count(&count).Error

	if err != nil {
		common.WriteError(fmt.Sprintf("统计映射IP数量错误: %v", err))
		return 0, err
	}
	return int(count), nil
}

// 方法2：使用结构体接收Scan结果
func QueryTransferIpCount2() (int, error) {
	type Result struct {
		Count int64 `json:"count"`
	}
	
	var result Result
	err := databases.Db.Table("network_nat_policies").
		Select("COUNT(DISTINCT transfer_ip) as count").
		Scan(&result).Error

	if err != nil {
		common.WriteError(fmt.Sprintf("统计映射IP数量错误: %v", err))
		return 0, err
	}
	return int(result.Count), nil
}

// 方法3：使用原生SQL（最直接）
func QueryTransferIpCount3() (int, error) {
	var count int64
	err := databases.Db.Raw("SELECT COUNT(DISTINCT transfer_ip) FROM network_nat_policies").
		Scan(&count).Error

	if err != nil {
		common.WriteError(fmt.Sprintf("统计映射IP数量错误: %v", err))
		return 0, err
	}
	return int(count), nil
} 