package main

import (
	"github.com/gin-gonic/gin"
	"github.com/livekit/protocol/auth"
	"net/http"
)

func main() {
	// 直接写死你的 LiveKit API Key 和 Secret
	apiKey := "devkey"
	apiSecret := "secret"

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		// 允许所有来源（* 表示任意域名/IP）
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		// 允许的 HTTP 方法
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		// 允许的请求头
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		// 是否允许携带 Cookie（如果设为 true，则不能使用 * 作为 Allow-Origin）
		// c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		// 处理 OPTIONS 预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204) // 直接返回 204 No Content
			return
		}

		c.Next() // 继续后续处理
	})
	r.GET("/api/livekit/token", func(c *gin.Context) {
		room := c.Query("room")
		identity := c.Query("identity")
		if room == "" || identity == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "room and identity required"})
			return
		}

		grant := &auth.VideoGrant{
			RoomJoin: true,
			Room:     room,
		}
		at := auth.NewAccessToken(apiKey, apiSecret)
		at.SetIdentity(identity)
		at.AddGrant(grant)

		token, err := at.ToJWT()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"token": token})
	})

	r.Run(":3000") // 启动在 3000 端口
}
