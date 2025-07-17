import { useState } from 'react'
import { Card, Radio, Input, Upload, Button, message, Spin, Image } from 'antd'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload'
import { jimengApi, deepseekApi } from './services/api'
import { fileToBase64, downloadFile } from './utils/fileUtils'
import './App.css'

type Mode = 'text-to-video' | 'image-to-video' | 'image-generation'

function App() {
  const [mode, setMode] = useState<Mode>('text-to-video')
  const [textInput, setTextInput] = useState('')
  const [imageFile, setImageFile] = useState<UploadFile | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'image' | 'video', url: string } | null>(null)

  const handleGenerate = async () => {
    if (!textInput.trim()) {
      message.error('请输入文本描述')
      return
    }

    if ((mode === 'image-to-video' || mode === 'image-generation') && !imageFile) {
      message.error('请上传图片文件')
      return
    }

    setLoading(true)
    try {
      let optimizedText = textInput
      
      try {
        optimizedText = await deepseekApi.processText(textInput)
      } catch (error) {
        console.warn('DeepSeek API failed, using original text:', error)
      }

      let response
      let imageBase64 = ''
      
      if (imageFile && imageFile.originFileObj) {
        imageBase64 = await fileToBase64(imageFile.originFileObj)
      }

      switch (mode) {
        case 'text-to-video':
          response = await jimengApi.generateTextToVideo({
            prompt: optimizedText,
            seed: -1,
            aspect_ratio: '16:9'
          })
          break
        case 'image-to-video':
          response = await jimengApi.generateImageToVideo({
            prompt: optimizedText,
            imageBase64,
            seed: -1,
            aspect_ratio: '16:9'
          })
          break
        case 'image-generation':
          response = await jimengApi.generateImage({
            prompt: optimizedText,
            imageBase64,
            resolution: '1024x1024',
            style: 'general'
          })
          break
      }

      if (response.success && response.data) {
        message.success('任务已提交，正在生成...')
        
        const checkStatus = async () => {
          const statusResponse = await jimengApi.checkStatus(response.data!.task_id)
          
          if (statusResponse.success && statusResponse.data) {
            const { status, result, video_url } = statusResponse.data
            
            if (status === 'done' && (result || video_url)) {
              // 使用video_url或result.url
              const finalResult = result || {
                type: mode === 'image-generation' ? 'image' as const : 'video' as const,
                url: video_url!
              }
              setResult(finalResult)
              message.success('生成完成！')
            } else if (status === 'failed') {
              message.error('生成失败，请重试')
            } else {
              setTimeout(checkStatus, 3000)
            }
          } else {
            message.error('检查状态失败，请刷新页面重试')
          }
        }
        
        setTimeout(checkStatus, 3000)
      } else {
        message.error(response.error || '生成失败，请重试')
      }
    } catch (error: any) {
      message.error(error.message || '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (result?.url) {
      const fileName = `generated-${result.type}-${Date.now()}.${result.type === 'image' ? 'png' : 'mp4'}`
      downloadFile(result.url, fileName)
    }
  }

  const uploadProps = {
    beforeUpload: (file: UploadFile) => {
      const isImage = file.type?.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件！')
        return false
      }
      setImageFile(file)
      return false
    },
    fileList: imageFile ? [imageFile] : [],
    onRemove: () => setImageFile(null),
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>AI 内容生成工具</h1>
      
      <Card title="选择生成模式" style={{ marginBottom: '20px' }}>
        <Radio.Group 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          style={{ marginBottom: '20px' }}
        >
          <Radio.Button value="text-to-video">文生视频</Radio.Button>
          <Radio.Button value="image-to-video">图生视频</Radio.Button>
          <Radio.Button value="image-generation">图片生成</Radio.Button>
        </Radio.Group>
      </Card>

      <Card title="输入内容" style={{ marginBottom: '20px' }}>
        {(mode === 'image-to-video' || mode === 'image-generation') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>上传图片：</label>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择图片</Button>
            </Upload>
          </div>
        )}
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>文本描述：</label>
          <Input.TextArea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="请输入详细的文本描述..."
            rows={4}
            style={{ marginBottom: '20px' }}
          />
        </div>

        <Button 
          type="primary" 
          onClick={handleGenerate}
          loading={loading}
          disabled={loading}
          size="large"
        >
          {loading ? '生成中...' : '开始生成'}
        </Button>
      </Card>

      {result && (
        <Card 
          title="生成结果" 
          extra={
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              下载
            </Button>
          }
        >
          {result.type === 'image' ? (
            <Image
              src={result.url}
              alt="生成的图片"
              style={{ maxWidth: '100%' }}
            />
          ) : (
            <video
              src={result.url}
              controls
              style={{ maxWidth: '100%' }}
            >
              您的浏览器不支持视频播放
            </video>
          )}
        </Card>
      )}

      {loading && (
        <Card style={{ textAlign: 'center', marginTop: '20px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '10px' }}>正在生成内容，请稍候...</p>
        </Card>
      )}
    </div>
  )
}

export default App
