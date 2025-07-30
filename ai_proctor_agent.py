#!/usr/bin/env python3
"""
AI 监考员代理 - 基于 LiveKit Agents 框架
功能：监控学生考试行为，检测作弊，提供智能提醒
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.plugins import deepgram, elevenlabs, openai, silero

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExamSession:
    """考试会话管理"""
    def __init__(self, student_id: str, room_name: str):
        self.student_id = student_id
        self.room_name = room_name
        self.start_time = datetime.now()
        self.violations = []
        self.screen_changes = 0
        self.voice_detected = False
        self.suspicious_activities = []

    def add_violation(self, violation_type: str, description: str):
        """记录违规行为"""
        violation = {
            "type": violation_type,
            "description": description,
            "timestamp": datetime.now().isoformat(),
            "student_id": self.student_id
        }
        self.violations.append(violation)
        logger.warning(f"违规检测: {self.student_id} - {violation_type}: {description}")

# 全局考试会话管理
exam_sessions: Dict[str, ExamSession] = {}

@function_tool
async def analyze_screen_content(
    context: RunContext,
    screen_text: str,
    student_id: str,
) -> Dict:
    """分析屏幕内容，检测是否包含考试相关内容"""
    
    if not student_id in exam_sessions:
        exam_sessions[student_id] = ExamSession(student_id, context.room.name)
    
    session = exam_sessions[student_id]
    
    # 检测关键词
    suspicious_keywords = [
        "百度", "google", "搜索", "答案", "作弊", "复制", "粘贴",
        "chatgpt", "gpt", "ai", "人工智能", "翻译", "词典"
    ]
    
    detected_keywords = []
    for keyword in suspicious_keywords:
        if keyword.lower() in screen_text.lower():
            detected_keywords.append(keyword)
    
    if detected_keywords:
        session.add_violation(
            "suspicious_content", 
            f"检测到可疑内容: {', '.join(detected_keywords)}"
        )
        return {
            "suspicious": True,
            "keywords": detected_keywords,
            "action": "warn_student"
        }
    
    return {"suspicious": False, "keywords": []}

@function_tool
async def detect_voice_activity(
    context: RunContext,
    student_id: str,
    has_voice: bool,
) -> Dict:
    """检测语音活动"""
    
    if not student_id in exam_sessions:
        exam_sessions[student_id] = ExamSession(student_id, context.room.name)
    
    session = exam_sessions[student_id]
    
    if has_voice and not session.voice_detected:
        session.voice_detected = True
        session.add_violation(
            "voice_detected", 
            "检测到语音活动，可能在与他人交流"
        )
        return {
            "action": "warn_student",
            "message": "检测到语音活动，请保持安静"
        }
    
    return {"action": "continue_monitoring"}

@function_tool
async def track_screen_changes(
    context: RunContext,
    student_id: str,
    window_title: str,
) -> Dict:
    """跟踪屏幕变化"""
    
    if not student_id in exam_sessions:
        exam_sessions[student_id] = ExamSession(student_id, context.room.name)
    
    session = exam_sessions[student_id]
    session.screen_changes += 1
    
    # 检测可疑窗口标题
    suspicious_windows = [
        "微信", "qq", "钉钉", "zoom", "teams", "discord",
        "浏览器", "chrome", "firefox", "safari", "edge"
    ]
    
    for suspicious in suspicious_windows:
        if suspicious.lower() in window_title.lower():
            session.add_violation(
                "suspicious_window", 
                f"切换到可疑窗口: {window_title}"
            )
            return {
                "action": "warn_student",
                "message": f"检测到切换到 {window_title}，请专注于考试"
            }
    
    return {"action": "continue_monitoring"}

@function_tool
async def get_exam_report(
    context: RunContext,
    student_id: str,
) -> Dict:
    """获取考试报告"""
    
    if student_id not in exam_sessions:
        return {"error": "未找到该学生的考试会话"}
    
    session = exam_sessions[student_id]
    duration = datetime.now() - session.start_time
    
    return {
        "student_id": student_id,
        "duration_minutes": round(duration.total_seconds() / 60, 2),
        "violations": session.violations,
        "screen_changes": session.screen_changes,
        "voice_detected": session.voice_detected,
        "total_violations": len(session.violations)
    }

class AIProctorAgent(Agent):
    """AI 监考员代理"""
    
    def __init__(self):
        super().__init__(
            instructions="""
            你是一个严格的 AI 监考员，负责监控学生考试过程。
            
            你的职责：
            1. 监控学生屏幕内容，检测是否包含考试相关内容
            2. 检测语音活动，确保学生没有与他人交流
            3. 跟踪屏幕变化，防止学生切换到其他应用
            4. 发现违规行为时，立即语音提醒学生
            5. 记录所有违规行为，生成考试报告
            
            违规行为类型：
            - suspicious_content: 屏幕包含可疑内容
            - voice_detected: 检测到语音活动
            - suspicious_window: 切换到可疑窗口
            - multiple_violations: 多次违规
            
            当发现违规时，你应该：
            1. 立即语音提醒学生
            2. 记录违规详情
            3. 根据违规严重程度决定是否终止考试
            
            保持专业、公正、严格的态度。
            """,
            tools=[
                analyze_screen_content,
                detect_voice_activity,
                track_screen_changes,
                get_exam_report,
            ]
        )

async def entrypoint(ctx: JobContext):
    """入口函数"""
    await ctx.connect()
    
    # 获取学生信息
    student_id = ctx.room.name.split("-")[-1] if "-" in ctx.room.name else "unknown"
    
    # 创建 AI 监考员
    agent = AIProctorAgent()
    
    # 配置语音识别和合成
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(model="nova-3"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(voice="alloy"),  # 使用严肃的语音
        userdata={"student_id": student_id}
    )
    
    # 启动监考会话
    await session.start(
        agent=agent,
        room=ctx.room,
    )
    
    # 监考循环
    while True:
        try:
            # 监控房间内的参与者
            for participant in ctx.room.participants:
                if participant.identity != "ai_proctor":
                    # 分析屏幕内容（如果有视频轨道）
                    for track in participant.video_tracks:
                        # 这里可以集成 OCR 来提取屏幕文字
                        # 暂时使用模拟数据
                        pass
                    
                    # 检测语音活动
                    for track in participant.audio_tracks:
                        # 检测是否有语音活动
                        pass
            
            await asyncio.sleep(5)  # 每5秒检查一次
            
        except Exception as e:
            logger.error(f"监考过程中出错: {e}")
            await asyncio.sleep(10)

if __name__ == "__main__":
    cli.run_app(entrypoint) 