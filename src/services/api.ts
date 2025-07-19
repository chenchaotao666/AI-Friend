import axios from 'axios'
import { API_CONFIG } from '../config'

// const JIMENG_API_BASE = API_CONFIG.JIMENG_API_BASE // 不再使用，改为直接使用代理

export interface TextToVideoRequest {
  prompt: string
  seed?: number
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9'
}

export interface ImageToVideoRequest {
  prompt: string
  imageBase64: string
  seed?: number
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9'
}

export interface ImageGenerationRequest {
  prompt: string
  width?: number
  height?: number
}

export interface ImageToImageRequest {
  prompt: string
  imageBase64: string
  controlnet_type?: 'canny' | 'depth' | 'pose'
  strength?: number
  width?: number
  height?: number
}

export interface ImageEditRequest {
  prompt: string
  imageBase64: string
  strength?: number
}

export interface GenerationResponse {
  success: boolean
  data?: {
    task_id: string
    status: 'pending' | 'processing' | 'done' | 'failed'
    video_url?: string
    result?: {
      type: 'image' | 'video'
      url: string
      description?: string
    }
  }
  error?: string
}

export const jimengApi = {
  async generateTextToVideo(request: TextToVideoRequest): Promise<GenerationResponse> {
    try {
      // 使用Python后端服务
      const response = await fetch('http://localhost:5000/api/text-to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          aspect_ratio: request.aspect_ratio || '16:9'
        })
      })
      
      const responseData = await response.json()
      console.log('即梦AI 文生视频 API 响应:', responseData)
      
      // 直接返回Python后端的响应
      return responseData
      
    } catch (error: any) {
      console.error('即梦AI 文生视频 API 错误:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async generateImageToVideo(request: ImageToVideoRequest): Promise<GenerationResponse> {
    try {
      // 使用Python后端服务
      const response = await fetch('http://localhost:5000/api/image-to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          imageBase64: request.imageBase64,
          aspect_ratio: request.aspect_ratio || '16:9'
        })
      })
      
      const responseData = await response.json()
      console.log('即梦AI 图生视频 API 响应:', responseData)
      
      // 直接返回Python后端的响应
      return responseData
    } catch (error: any) {
      console.error('即梦AI 图生视频 API 错误:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async generateImage(request: ImageGenerationRequest): Promise<GenerationResponse> {
    try {
      // 使用Python后端服务
      const response = await fetch('http://localhost:5000/api/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          width: request.width || 512,
          height: request.height || 512
        })
      })
      
      const responseData = await response.json()
      console.log('即梦AI 图片生成 API 响应:', responseData)
      
      // 直接返回Python后端的响应
      return responseData
      
    } catch (error: any) {
      console.error('即梦AI 图片生成 API 错误:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async generateImageToImage(request: ImageToImageRequest): Promise<GenerationResponse> {
    try {
      // 使用Python后端服务
      const response = await fetch('http://localhost:5000/api/image-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          imageBase64: request.imageBase64,
          controlnet_type: request.controlnet_type || 'depth',
          strength: request.strength || 0.6,
          width: request.width || 512,
          height: request.height || 512
        })
      })
      
      const responseData = await response.json()
      console.log('即梦AI 图生图 API 响应:', responseData)
      
      // 直接返回Python后端的响应
      return responseData
      
    } catch (error: any) {
      console.error('即梦AI 图生图 API 错误:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async editImage(request: ImageEditRequest): Promise<GenerationResponse> {
    try {
      // 使用Python后端服务
      const response = await fetch('http://localhost:5000/api/image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          imageBase64: request.imageBase64,
          strength: request.strength || 0.5
        })
      })
      
      const responseData = await response.json()
      console.log('即梦AI 图片修改 API 响应:', responseData)
      
      // 直接返回Python后端的响应
      return responseData
      
    } catch (error: any) {
      console.error('即梦AI 图片修改 API 错误:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async checkStatus(task_id: string): Promise<GenerationResponse> {
    try {
      // 使用Python后端服务
      const response = await fetch('http://localhost:5000/api/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_id: task_id
        })
      })
      
      const responseData = await response.json()
      console.log('即梦AI 查询任务状态 API 响应:', responseData)
      
      // 直接返回Python后端的响应
      return responseData
      
    } catch (error: any) {
      console.error('即梦AI 查询任务状态 API 错误:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async checkImageEditStatus(task_id: string): Promise<GenerationResponse> {
    try {
      // 使用专门的图片修改状态查询接口
      const response = await fetch('http://localhost:5000/api/image-edit-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_id: task_id
        })
      })
      
      const responseData = await response.json()
      console.log('即梦AI 图片修改状态查询 API 响应:', responseData)
      
      // 直接返回Python后端的响应
      return responseData
      
    } catch (error: any) {
      console.error('即梦AI 图片修改状态查询 API 错误:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export const deepseekApi = {
  async processVideoPrompt(text: string): Promise<string> {
    try {
      const response = await axios.post(`${API_CONFIG.DEEPSEEK_API_BASE}/chat/completions`, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的视频生成提示词优化专家。请根据以下3个要点优化用户的描述：

1. 明确运镜方式：
   - 添加具体的镜头运动描述（如"镜头围绕...旋转"、"镜头从上往下俯拍"、"镜头缓缓推进"等）
   - 描述视觉焦点和画面构图

2. 明确行动逻辑：
   - 确保动作有清晰的时间顺序
   - 使用顺序词（首先、接着、然后、最后等）
   - 描述连贯的动作流程

3. 文字描述精准：
   - 使用具体生动的动词
   - 避免含糊不清的表达
   - 添加细节描述增强画面感

请将用户输入优化为更适合视频生成的提示词，保持原意但增强视觉表现力。

重要限制：
1. 优化后的提示词必须控制在150个字以内，请精炼表达
2. 直接返回优化后的提示词内容，不要添加任何前缀、后缀或说明文字`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      }, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      return response.data.choices[0].message.content
    } catch (error: any) {
      console.error('DeepSeek API error:', error)
      return text
    }
  },

  async processImagePrompt(text: string): Promise<string> {
    try {
      const response = await axios.post(`${API_CONFIG.DEEPSEEK_API_BASE}/chat/completions`, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的图片生成提示词优化专家。请根据以下要点优化用户的描述：

1. 视觉元素描述：
   - 明确主体对象、背景环境、色彩搭配
   - 添加光影效果描述（如"柔和的阳光"、"戏剧性的阴影"等）
   - 描述材质质感和细节特征

2. 艺术风格指定：
   - 指定绘画风格（如写实、插画、水彩、油画等）
   - 添加艺术流派或艺术家风格参考
   - 描述画面构图和视角

3. 画面氛围营造：
   - 使用情感化的形容词
   - 描述整体氛围和情绪表达
   - 添加细节描述增强画面感染力

请将用户输入优化为更适合图片生成的提示词，保持原意但增强视觉表现力。

重要限制：
1. 优化后的提示词必须控制在120个字以内，请精炼表达
2. 直接返回优化后的提示词内容，不要添加任何前缀、后缀或说明文字`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      }, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      return response.data.choices[0].message.content
    } catch (error: any) {
      console.error('DeepSeek API error:', error)
      return text
    }
  }
}