import axios from 'axios'
import { API_CONFIG } from '../config'
import { generateVolcengineSignature } from '../utils/volcengineAuth'

const JIMENG_API_BASE = API_CONFIG.JIMENG_API_BASE

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
  imageBase64?: string
  resolution?: string
  style?: string
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
    }
  }
  error?: string
}

export const jimengApi = {
  async generateTextToVideo(request: TextToVideoRequest): Promise<GenerationResponse> {
    try {
      const requestBody = {
        req_key: "jimeng_vgfm_t2v_l20",
        prompt: request.prompt,
        seed: request.seed || -1,
        aspect_ratio: request.aspect_ratio || '16:9'
      }
      
      const body = JSON.stringify(requestBody)
      const path = '/'
      const query = 'Action=CVSync2AsyncSubmitTask&Version=2022-08-31'
      
      // 生成火山引擎签名
      const signature = generateVolcengineSignature('POST', path, query, body)
      
      const response = await axios.post(
        `${JIMENG_API_BASE}?${query}`,
        requestBody,
        {
          headers: signature.headers
        }
      )
      
      console.log('即梦AI 文生视频 API 响应:', response.data)
      
      return {
        success: true,
        data: {
          task_id: response.data.data.task_id,
          status: 'pending'
        }
      }
      
    } catch (error: any) {
      console.error('即梦AI 文生视频 API 错误:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  },

  async generateImageToVideo(request: ImageToVideoRequest): Promise<GenerationResponse> {
    try {
      const requestBody = {
        req_key: "jimeng_vgfm_i2v_l20", // 图生视频的req_key
        prompt: request.prompt,
        image: request.imageBase64,
        seed: request.seed || -1,
        aspect_ratio: request.aspect_ratio || '16:9'
      }
      
      const body = JSON.stringify(requestBody)
      const path = '/'
      const query = 'Action=CVSync2AsyncSubmitTask&Version=2022-08-31'
      
      // 生成火山引擎签名
      const signature = generateVolcengineSignature('POST', path, query, body)
      
      const response = await axios.post(
        `${JIMENG_API_BASE}?${query}`,
        requestBody,
        {
          headers: signature.headers
        }
      )
      
      console.log('即梦AI 图生视频 API 响应:', response.data)
      
      return {
        success: true,
        data: {
          task_id: response.data.data.task_id,
          status: 'pending'
        }
      }
    } catch (error: any) {
      console.error('即梦AI 图生视频 API 错误:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  },

  async generateImage(request: ImageGenerationRequest): Promise<GenerationResponse> {
    try {
      // 即梦AI的图片生成API格式（需要根据实际文档调整）
      const submitUrl = `${JIMENG_API_BASE}?Action=CVSync2AsyncSubmitTask&Version=2022-08-31`
      const requestBody = {
        req_key: "jimeng_image_generation", // 图片生成的req_key需要根据实际文档确定
        prompt: request.prompt,
        image: request.imageBase64,
        resolution: request.resolution || '1024x1024',
        style: request.style || 'general'
      }
      
      console.log('即梦AI 图片生成 API 请求格式:', {
        url: submitUrl,
        method: 'POST',
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
          // 需要火山引擎签名认证 headers
        }
      })
      
      // 模拟API调用
      const mockTaskId = 'img_task_' + Date.now()
      
      return {
        success: true,
        data: {
          task_id: mockTaskId,
          status: 'pending'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  },

  async checkStatus(task_id: string): Promise<GenerationResponse> {
    try {
      const requestBody = {
        req_key: "jimeng_vgfm_t2v_l20",
        task_id: task_id
      }
      
      const body = JSON.stringify(requestBody)
      const path = '/'
      const query = 'Action=CVSync2AsyncGetResult&Version=2022-08-31'
      
      // 生成火山引擎签名
      const signature = generateVolcengineSignature('POST', path, query, body)
      
      const response = await axios.post(
        `${JIMENG_API_BASE}?${query}`,
        requestBody,
        {
          headers: signature.headers
        }
      )
      
      console.log('即梦AI 查询任务状态 API 响应:', response.data)
      
      const { data } = response.data
      
      if (data.status === 'done' && data.video_url) {
        return {
          success: true,
          data: {
            task_id: task_id,
            status: 'done',
            video_url: data.video_url,
            result: {
              type: 'video',
              url: data.video_url
            }
          }
        }
      } else {
        return {
          success: true,
          data: {
            task_id: task_id,
            status: data.status || 'processing'
          }
        }
      }
      
    } catch (error: any) {
      console.error('即梦AI 查询任务状态 API 错误:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }
}

export const deepseekApi = {
  async processText(text: string): Promise<string> {
    try {
      const response = await axios.post(`${API_CONFIG.DEEPSEEK_API_BASE}/chat/completions`, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: `优化以下文本描述，使其更适合AI生成图片或视频：${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
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