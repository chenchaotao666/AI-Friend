import { useState, useEffect } from 'react'
import { Card, Radio, Input, Upload, Button, message, Spin, Image } from 'antd'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload'
import { jimengApi, deepseekApi } from './services/api'
import { fileToBase64, downloadFile, detectImageAspectRatio, type AspectRatioType, IMAGE_ASPECT_RATIOS, type ImageAspectRatioType } from './utils/fileUtils'
import './App.css'

type Mode = 'text-to-video' | 'image-to-video' | 'text-to-image' | 'image-to-image' | 'image-edit'

function App() {
  const [mode, setMode] = useState<Mode>('text-to-video')
  
  // 为每个功能创建独立的状态
  const [textToVideoState, setTextToVideoState] = useState({
    textInput: '',
    loading: false,
    result: null as { type: 'image' | 'video', url: string, description?: string } | null,
    statusMessage: '',
    checkCount: 0,
    optimizing: false
  })
  
  const [imageToVideoState, setImageToVideoState] = useState({
    textInput: '',
    imageFile: null as UploadFile | null,
    loading: false,
    result: null as { type: 'image' | 'video', url: string, description?: string } | null,
    statusMessage: '',
    checkCount: 0,
    optimizing: false,
    previewUrl: null as string | null,
    imageInfo: null as {
      width: number
      height: number
      aspectRatio: number
      closestRatio: AspectRatioType
      difference: number
    } | null
  })
  
  const [textToImageState, setTextToImageState] = useState({
    textInput: '',
    loading: false,
    result: null as { type: 'image' | 'video', url: string, description?: string } | null,
    optimizing: false
  })
  
  const [imageToImageState, setImageToImageState] = useState({
    textInput: '',
    imageFile: null as UploadFile | null,
    loading: false,
    result: null as { type: 'image' | 'video', url: string, description?: string } | null,
    optimizing: false,
    previewUrl: null as string | null,
    imageInfo: null as {
      width: number
      height: number
      aspectRatio: number
      closestRatio: AspectRatioType
      difference: number
    } | null,
    controlnetType: 'depth' as 'canny' | 'depth' | 'pose',
    strength: 0.6
  })
  
  const [imageEditState, setImageEditState] = useState({
    textInput: '',
    imageFile: null as UploadFile | null,
    loading: false,
    result: null as { type: 'image' | 'video', url: string, description?: string } | null,
    statusMessage: '',
    checkCount: 0,
    optimizing: false,
    previewUrl: null as string | null,
    imageInfo: null as {
      width: number
      height: number
      aspectRatio: number
      closestRatio: AspectRatioType
      difference: number
    } | null,
    strength: 0.5
  })
  
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('16:9')
  const [imageAspectRatio, setImageAspectRatio] = useState<ImageAspectRatioType>('1:1')

  // 清理预览URL
  useEffect(() => {
    return () => {
      if (imageToVideoState.previewUrl) {
        URL.revokeObjectURL(imageToVideoState.previewUrl)
      }
    }
  }, [imageToVideoState.previewUrl])

  // 当图片文件变化时更新预览URL和检测尺寸
  useEffect(() => {
    if (imageToVideoState.imageFile) {
      if (imageToVideoState.previewUrl) {
        URL.revokeObjectURL(imageToVideoState.previewUrl)
      }
      
      const file = imageToVideoState.imageFile.originFileObj || imageToVideoState.imageFile as any
      if (file instanceof File) {
        const url = URL.createObjectURL(file)
        
        // 检测图片尺寸和最接近的比例
        detectImageAspectRatio(file)
          .then(info => {
            setImageToVideoState(prev => ({
              ...prev,
              previewUrl: url,
              imageInfo: info
            }))
            // 自动选择最接近的比例
            setAspectRatio(info.closestRatio)
            message.success(`检测到图片尺寸 ${info.width}×${info.height}，已自动选择最接近的比例 ${info.closestRatio}`)
          })
          .catch(error => {
            console.error('图片尺寸检测失败:', error)
            setImageToVideoState(prev => ({
              ...prev,
              previewUrl: url,
              imageInfo: null
            }))
            message.warning('无法检测图片尺寸，请手动选择比例')
          })
      } else {
        setImageToVideoState(prev => ({
          ...prev,
          previewUrl: null,
          imageInfo: null
        }))
      }
    } else {
      if (imageToVideoState.previewUrl) {
        URL.revokeObjectURL(imageToVideoState.previewUrl)
      }
      setImageToVideoState(prev => ({
        ...prev,
        previewUrl: null,
        imageInfo: null
      }))
    }
  }, [imageToVideoState.imageFile])

  // 当图生图的图片文件变化时更新预览URL和检测尺寸
  useEffect(() => {
    if (imageToImageState.imageFile) {
      if (imageToImageState.previewUrl) {
        URL.revokeObjectURL(imageToImageState.previewUrl)
      }
      
      const file = imageToImageState.imageFile.originFileObj || imageToImageState.imageFile as any
      if (file instanceof File) {
        const url = URL.createObjectURL(file)
        
        // 检测图片尺寸和最接近的比例
        detectImageAspectRatio(file)
          .then(info => {
            setImageToImageState(prev => ({
              ...prev,
              previewUrl: url,
              imageInfo: info
            }))
            // 图生图不需要自动选择比例，保持用户选择
            message.success(`检测到图片尺寸 ${info.width}×${info.height}`)
          })
          .catch(error => {
            console.error('图片尺寸检测失败:', error)
            setImageToImageState(prev => ({
              ...prev,
              previewUrl: url,
              imageInfo: null
            }))
            message.warning('无法检测图片尺寸')
          })
      } else {
        setImageToImageState(prev => ({
          ...prev,
          previewUrl: null,
          imageInfo: null
        }))
      }
    } else {
      if (imageToImageState.previewUrl) {
        URL.revokeObjectURL(imageToImageState.previewUrl)
      }
      setImageToImageState(prev => ({
        ...prev,
        previewUrl: null,
        imageInfo: null
      }))
    }
  }, [imageToImageState.imageFile])

  // 当图片修改的图片文件变化时更新预览URL和检测尺寸
  useEffect(() => {
    if (imageEditState.imageFile) {
      if (imageEditState.previewUrl) {
        URL.revokeObjectURL(imageEditState.previewUrl)
      }
      
      const file = imageEditState.imageFile.originFileObj || imageEditState.imageFile as any
      if (file instanceof File) {
        const url = URL.createObjectURL(file)
        
        // 检测图片尺寸和最接近的比例
        detectImageAspectRatio(file)
          .then(info => {
            setImageEditState(prev => ({
              ...prev,
              previewUrl: url,
              imageInfo: info
            }))
            message.success(`检测到图片尺寸 ${info.width}×${info.height}`)
          })
          .catch(error => {
            console.error('图片尺寸检测失败:', error)
            setImageEditState(prev => ({
              ...prev,
              previewUrl: url,
              imageInfo: null
            }))
            message.warning('无法检测图片尺寸')
          })
      } else {
        setImageEditState(prev => ({
          ...prev,
          previewUrl: null,
          imageInfo: null
        }))
      }
    } else {
      if (imageEditState.previewUrl) {
        URL.revokeObjectURL(imageEditState.previewUrl)
      }
      setImageEditState(prev => ({
        ...prev,
        previewUrl: null,
        imageInfo: null
      }))
    }
  }, [imageEditState.imageFile])


  const handleOptimizeText = async (currentMode: Mode) => {
    // 图片修改模式不支持AI优化
    if (currentMode === 'image-edit') {
      message.warning('图片修改模式不支持AI优化功能')
      return
    }
    
    const getCurrentState = () => {
      switch (currentMode) {
        case 'text-to-video': return textToVideoState
        case 'image-to-video': return imageToVideoState  
        case 'text-to-image': return textToImageState
        case 'image-to-image': return imageToImageState
      }
    }
    
    const setState = (updater: any) => {
      switch (currentMode) {
        case 'text-to-video': return setTextToVideoState(updater)
        case 'image-to-video': return setImageToVideoState(updater)
        case 'text-to-image': return setTextToImageState(updater)
        case 'image-to-image': return setImageToImageState(updater)
      }
    }
    
    const currentState = getCurrentState()
    
    if (!currentState.textInput.trim()) {
      message.error('请先输入文本描述')
      return
    }

    setState((prev: any) => ({ ...prev, optimizing: true }))
    try {
      // 根据模式选择不同的优化函数
      let optimizedText: string
      if (currentMode === 'text-to-image') {
        optimizedText = await deepseekApi.processImagePrompt(currentState.textInput)
      } else {
        // text-to-video 和 image-to-video 使用视频优化
        optimizedText = await deepseekApi.processVideoPrompt(currentState.textInput)
      }
      
      // 清理可能的前缀文字
      const cleanedText = optimizedText
        .replace(/^优化后的提示词[:：]\s*/g, '')
        .replace(/^提示词[:：]\s*/g, '')
        .replace(/^以下是优化后的内容[:：]\s*/g, '')
        .trim()
      
      setState((prev: any) => ({ ...prev, textInput: cleanedText }))
      message.success('提示词优化完成！')
    } catch (error: any) {
      console.error('DeepSeek API error:', error)
      message.error('优化失败，请检查网络连接或稍后重试')
    } finally {
      setState((prev: any) => ({ ...prev, optimizing: false }))
    }
  }

  const handleGenerate = async () => {
    const getCurrentState = () => {
      switch (mode) {
        case 'text-to-video': return textToVideoState
        case 'image-to-video': return imageToVideoState  
        case 'text-to-image': return textToImageState
        case 'image-to-image': return imageToImageState
        case 'image-edit': return imageEditState
      }
    }
    
    const setState = (updater: any) => {
      switch (mode) {
        case 'text-to-video': return setTextToVideoState(updater)
        case 'image-to-video': return setImageToVideoState(updater)
        case 'text-to-image': return setTextToImageState(updater)
        case 'image-to-image': return setImageToImageState(updater)
        case 'image-edit': return setImageEditState(updater)
      }
    }
    
    const currentState = getCurrentState()
    
    if (!currentState.textInput.trim()) {
      message.error('请输入文本描述')
      return
    }

    if ((mode === 'text-to-video' || mode === 'image-to-video') && currentState.textInput.length > 150) {
      message.error('视频生成提示词不能超过150字，请精简描述或使用AI优化功能')
      return
    }

    if (mode === 'image-to-video' && !imageToVideoState.imageFile) {
      message.error('请上传图片文件')
      return
    }

    if (mode === 'image-to-image' && !imageToImageState.imageFile) {
      message.error('请上传图片文件')
      return
    }

    if (mode === 'image-edit' && !imageEditState.imageFile) {
      message.error('请上传原始图片文件')
      return
    }


    setState((prev: any) => ({ 
      ...prev, 
      loading: true, 
      statusMessage: '正在提交任务...',
      checkCount: 0,
      result: null 
    }))
    
    try {
      // 直接使用用户输入的文本，不自动优化
      const promptText = currentState.textInput

      let response: any
      let imageBase64 = ''
      
      if (imageToVideoState.imageFile || imageToImageState.imageFile || imageEditState.imageFile) {
        let targetImageFile
        switch (mode) {
          case 'image-to-video':
            targetImageFile = imageToVideoState.imageFile
            break
          case 'image-to-image':
            targetImageFile = imageToImageState.imageFile
            break
          case 'image-edit':
            targetImageFile = imageEditState.imageFile
            break
        }
        
        if (targetImageFile) {
          console.log('图片文件对象:', targetImageFile)
          // 尝试从不同属性获取实际文件对象
          const actualFile = targetImageFile.originFileObj || targetImageFile
          console.log('实际文件对象:', actualFile)
          
          if (actualFile instanceof File) {
            console.log('正在处理图片文件:', actualFile.name, actualFile.size, actualFile.type)
            imageBase64 = await fileToBase64(actualFile)
            console.log('图片base64长度:', imageBase64.length)
            console.log('图片base64前100字符:', imageBase64.substring(0, 100))
          } else {
            console.error('无法获取文件对象')
          }
        }
      }
      

      switch (mode) {
        case 'text-to-video':
          response = await jimengApi.generateTextToVideo({
            prompt: promptText,
            seed: -1,
            aspect_ratio: aspectRatio
          })
          break
        case 'image-to-video':
          console.log('调用图生视频API，参数:', {
            prompt: promptText,
            imageBase64: imageBase64 ? `${imageBase64.length}字符` : '空',
            seed: -1,
            aspect_ratio: '16:9'
          })
          response = await jimengApi.generateImageToVideo({
            prompt: promptText,
            imageBase64,
            seed: -1,
            aspect_ratio: aspectRatio
          })
          break
        case 'text-to-image':
          const selectedImageRatio = IMAGE_ASPECT_RATIOS.find(r => r.ratio === imageAspectRatio)
          response = await jimengApi.generateImage({
            prompt: promptText,
            width: selectedImageRatio?.width || 512,
            height: selectedImageRatio?.height || 512
          })
          // 图片生成直接返回结果，不需要轮询
          if (response.success && response.data && response.data.result) {
            setState((prev: any) => ({ ...prev, result: response.data.result, loading: false }))
            message.success('图片生成完成！')
            return
          }
          break
        case 'image-to-image':
          const selectedImg2ImgRatio = IMAGE_ASPECT_RATIOS.find(r => r.ratio === imageAspectRatio)
          response = await jimengApi.generateImageToImage({
            prompt: promptText,
            imageBase64,
            controlnet_type: imageToImageState.controlnetType,
            strength: imageToImageState.strength,
            width: selectedImg2ImgRatio?.width || 512,
            height: selectedImg2ImgRatio?.height || 512
          })
          // 图生图直接返回结果，不需要轮询
          if (response.success && response.data && response.data.result) {
            setState((prev: any) => ({ ...prev, result: response.data.result, loading: false }))
            message.success('图生图完成！')
            return
          }
          break
        case 'image-edit':
          response = await jimengApi.editImage({
            prompt: promptText,
            imageBase64,
            strength: imageEditState.strength
          })
          break
      }

      if (response.success && response.data) {
        message.success('任务已提交，正在生成...')
        setState((prev: any) => ({ ...prev, statusMessage: '任务已提交，正在处理中...' }))
        
        const checkStatus = async () => {
          setState((prev: any) => {
            const newCount = prev.checkCount + 1
            return {
              ...prev,
              checkCount: newCount,
              statusMessage: `正在查询状态... (第${newCount}次检查)`
            }
          })
          
          // 根据模式选择不同的状态查询API
          const statusResponse = mode === 'image-edit' 
            ? await jimengApi.checkImageEditStatus(response.data!.task_id)
            : await jimengApi.checkStatus(response.data!.task_id)
          
          console.log(`${mode} 状态查询响应:`, statusResponse)
          
          if (statusResponse.success && statusResponse.data) {
            const { status, result, video_url } = statusResponse.data
            
            if (status === 'done' && (result || video_url)) {
              // 使用video_url或result.url
              const finalResult = result || {
                type: (mode === 'text-to-image' || mode === 'image-to-image' || mode === 'image-edit') ? 'image' as const : 'video' as const,
                url: video_url!
              }
              setState((prev: any) => ({ 
                ...prev, 
                result: finalResult, 
                statusMessage: '生成完成！', 
                loading: false 
              }))
              message.success('生成完成！')
            } else if (status === 'failed') {
              setState((prev: any) => ({ 
                ...prev, 
                statusMessage: '生成失败', 
                loading: false 
              }))
              message.error('生成失败，请重试')
            } else {
              // 显示具体状态，继续保持loading状态
              const statusMap: Record<string, string> = {
                'processing': '正在处理中',
                'pending': '排队等待中',
                'running': '正在生成中',
                'in_queue': '任务已提交，排队等待中',
                'generating': '正在处理中'
              }
              setState((prev: any) => ({ 
                ...prev, 
                statusMessage: statusMap[status] || `当前状态: ${status}` 
              }))
              // 保持loading状态，继续检查
              setTimeout(checkStatus, 3000)
            }
          } else {
            setState((prev: any) => ({ 
              ...prev, 
              statusMessage: '状态查询失败', 
              loading: false 
            }))
            message.error('检查状态失败，请刷新页面重试')
          }
        }
        
        setTimeout(checkStatus, 3000)
      } else {
        setState((prev: any) => ({ 
          ...prev, 
          statusMessage: '任务提交失败', 
          loading: false 
        }))
        message.error(response.error || '生成失败，请重试')
      }
    } catch (error: any) {
      setState((prev: any) => ({ 
        ...prev, 
        statusMessage: '生成失败', 
        loading: false 
      }))
      message.error(error.message || '生成失败，请重试')
    }
  }

  const handleDownload = () => {
    const getCurrentState = () => {
      switch (mode) {
        case 'text-to-video': return textToVideoState
        case 'image-to-video': return imageToVideoState  
        case 'text-to-image': return textToImageState
        case 'image-to-image': return imageToImageState
        case 'image-edit': return imageEditState
      }
    }
    
    const currentState = getCurrentState()
    if (currentState.result?.url) {
      const fileName = `generated-${currentState.result.type}-${Date.now()}.${currentState.result.type === 'image' ? 'png' : 'mp4'}`
      downloadFile(currentState.result.url, fileName)
    }
  }

  const uploadProps = {
    beforeUpload: (file: UploadFile) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const isValidImage = validTypes.includes(file.type || '')
      if (!isValidImage) {
        message.error('只支持 JPEG、PNG、WebP 格式的图片！')
        return false
      }
      
      const isValidSize = (file.size || 0) <= 10 * 1024 * 1024 // 10MB
      if (!isValidSize) {
        message.error('图片大小不能超过 10MB！')
        return false
      }
      
      setImageToVideoState(prev => ({ ...prev, imageFile: file }))
      return false
    },
    fileList: imageToVideoState.imageFile ? [imageToVideoState.imageFile] : [],
    onRemove: () => setImageToVideoState(prev => ({ ...prev, imageFile: null })),
  }

  const imageToImageUploadProps = {
    beforeUpload: (file: UploadFile) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const isValidImage = validTypes.includes(file.type || '')
      if (!isValidImage) {
        message.error('只支持 JPEG、PNG、WebP 格式的图片！')
        return false
      }
      
      const isValidSize = (file.size || 0) <= 10 * 1024 * 1024 // 10MB
      if (!isValidSize) {
        message.error('图片大小不能超过 10MB！')
        return false
      }
      
      setImageToImageState(prev => ({ ...prev, imageFile: file }))
      return false
    },
    fileList: imageToImageState.imageFile ? [imageToImageState.imageFile] : [],
    onRemove: () => setImageToImageState(prev => ({ ...prev, imageFile: null })),
  }

  const imageEditUploadProps = {
    beforeUpload: (file: UploadFile) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const isValidImage = validTypes.includes(file.type || '')
      if (!isValidImage) {
        message.error('只支持 JPEG、PNG、WebP 格式的图片！')
        return false
      }
      
      const isValidSize = (file.size || 0) <= 10 * 1024 * 1024 // 10MB
      if (!isValidSize) {
        message.error('图片大小不能超过 10MB！')
        return false
      }
      
      setImageEditState(prev => ({ ...prev, imageFile: file }))
      return false
    },
    fileList: imageEditState.imageFile ? [imageEditState.imageFile] : [],
    onRemove: () => setImageEditState(prev => ({ ...prev, imageFile: null })),
  }


  return (
    <div style={{ padding: '20px', width: '1000px', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto', marginTop: '0', marginBottom: '0' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', marginTop: '0' }}>AI 内容生成工具</h1>
      
      <Card title="选择生成模式" style={{ marginBottom: '20px' }}>
        <Radio.Group 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          style={{ marginBottom: '20px' }}
        >
          <Radio.Button value="text-to-video">文生视频</Radio.Button>
          <Radio.Button value="image-to-video">图生视频</Radio.Button>
          <Radio.Button value="text-to-image">文生图</Radio.Button>
          {/* <Radio.Button value="image-to-image">图生图</Radio.Button> */}
          <Radio.Button value="image-edit">图片修改</Radio.Button>
        </Radio.Group>
      </Card>

      <Card title="输入内容" style={{ marginBottom: '20px' }}>
        {(mode === 'image-to-video' || mode === 'image-to-image' || mode === 'image-edit') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>上传图片：</label>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div>
                <Upload {...(() => {
                  switch (mode) {
                    case 'image-to-video': return uploadProps
                    case 'image-to-image': return imageToImageUploadProps
                    case 'image-edit': return imageEditUploadProps
                    default: return uploadProps
                  }
                })()}>
                  <Button icon={<UploadOutlined />}>
                    {mode === 'image-edit' ? '选择原始图片' : '选择图片'}
                  </Button>
                </Upload>
              </div>
              {((mode === 'image-to-video' && imageToVideoState.imageFile) || (mode === 'image-to-image' && imageToImageState.imageFile) || (mode === 'image-edit' && imageEditState.imageFile)) && (
                <div style={{ flex: 1, maxWidth: '300px' }}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                    预览图片：
                  </div>
                  <div style={{ 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px', 
                    padding: '8px',
                    backgroundColor: '#fafafa'
                  }}>
                    {(() => {
                      let previewUrl = null
                      switch (mode) {
                        case 'image-to-video': 
                          previewUrl = imageToVideoState.previewUrl
                          break
                        case 'image-to-image': 
                          previewUrl = imageToImageState.previewUrl
                          break
                        case 'image-edit': 
                          previewUrl = imageEditState.previewUrl
                          break
                      }
                      return previewUrl && (
                        <img
                          src={previewUrl}
                          alt="预览"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '4px',
                            display: 'block'
                          }}
                        />
                      )
                    })()}
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      color: '#666',
                      textAlign: 'center'
                    }}>
                      {(() => {
                        let currentFile, currentInfo
                        switch (mode) {
                          case 'image-to-video': 
                            currentFile = imageToVideoState.imageFile
                            currentInfo = imageToVideoState.imageInfo
                            break
                          case 'image-to-image': 
                            currentFile = imageToImageState.imageFile
                            currentInfo = imageToImageState.imageInfo
                            break
                          case 'image-edit': 
                            currentFile = imageEditState.imageFile
                            currentInfo = imageEditState.imageInfo
                            break
                        }
                        return currentFile && (
                          <>
                            <div>{currentFile.name} ({Math.round((currentFile.size || 0) / 1024)}KB)</div>
                            {currentInfo && (
                              <div style={{ marginTop: '4px' }}>
                                <div>尺寸: {currentInfo.width}×{currentInfo.height}</div>
                                <div>比例: {currentInfo.aspectRatio.toFixed(2)} (最接近 {currentInfo.closestRatio})</div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 图片修改的选项 */}
            {mode === 'image-edit' && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '6px', border: '1px solid #d6f7ff' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
                    🎨 智能图片编辑说明
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
                    使用自然语言描述您想要的修改效果，AI会智能理解并应用编辑。支持：<br/>
                    • <strong>添加元素</strong>：添加一道彩虹、添加雪花效果<br/>
                    • <strong>删除元素</strong>：删除背景中的人物、去掉水印<br/>
                    • <strong>修改风格</strong>：改成卡通风格、转换为油画效果<br/>
                    • <strong>调整色彩</strong>：把天空变成橙色、让整体更明亮<br/>
                    • <strong>背景替换</strong>：背景换成海滩、在星空下<br/>
                    • <strong>表情动作</strong>：让人物微笑、改变手势
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>编辑强度：{imageEditState.strength}</label>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="1.0" 
                    step="0.1" 
                    value={imageEditState.strength}
                    onChange={(e) => setImageEditState(prev => ({ ...prev, strength: parseFloat(e.target.value) }))}
                    style={{ width: '100%', marginBottom: '10px' }}
                  />
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    💡 数值越高，编辑效果越明显；数值越低，保持原图特征越多 (建议0.3-0.7)
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>文本描述：</label>
          {(mode === 'text-to-image' || mode === 'image-to-image' || mode === 'image-edit') && (
            <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                <strong>提示词建议：</strong>
                {(() => {
                  switch (mode) {
                    case 'text-to-image': 
                      return '【艺术风格】+【主体描述】+【文字排版】'
                    case 'image-to-image': 
                      return '【变化描述】+【风格转换】+【细节调整】'
                    case 'image-edit': 
                      return '【编辑操作】+【目标效果】+【细节要求】'
                    default: 
                      return ''
                  }
                })()}<br/>
                例如：{(() => {
                  switch (mode) {
                    case 'text-to-image': 
                      return '工笔画风格，三维古风，东方禅意，航拍高角度视角，捕捉了海底极小人物的奔跑追逐'
                    case 'image-to-image': 
                      return '转换为油画风格，增强色彩饱和度，保持原有构图但改变光影效果'
                    case 'image-edit': 
                      return '把衣服改成红色的，添加一道彩虹，背景换成海边，去掉多余的文字'
                    default: 
                      return ''
                  }
                })()}
              </p>
            </div>
          )}
          <Input.TextArea
            value={(() => {
              switch (mode) {
                case 'text-to-video': return textToVideoState.textInput
                case 'image-to-video': return imageToVideoState.textInput  
                case 'text-to-image': return textToImageState.textInput
                case 'image-to-image': return imageToImageState.textInput
                case 'image-edit': return imageEditState.textInput
              }
            })()}
            onChange={(e) => {
              const value = e.target.value
              switch (mode) {
                case 'text-to-video': 
                  setTextToVideoState(prev => ({ ...prev, textInput: value }))
                  break
                case 'image-to-video': 
                  setImageToVideoState(prev => ({ ...prev, textInput: value }))
                  break
                case 'text-to-image': 
                  setTextToImageState(prev => ({ ...prev, textInput: value }))
                  break
                case 'image-to-image': 
                  setImageToImageState(prev => ({ ...prev, textInput: value }))
                  break
                case 'image-edit': 
                  setImageEditState(prev => ({ ...prev, textInput: value }))
                  break
              }
            }}
            placeholder={(() => {
              switch (mode) {
                case 'text-to-image': 
                  return "请输入图片描述，如：工笔画风格，一只小猫坐在樱花树下..."
                case 'image-to-image': 
                  return "请输入变化描述，如：转换为油画风格，增强色彩饱和度..."
                case 'image-edit': 
                  return "请用自然语言描述编辑需求，如：把衣服改成红色，添加彩虹，背景换成海边..."
                default: 
                  return "请输入详细的文本描述..."
              }
            })()}
            rows={6}
            style={{ marginBottom: '5px', width: '100%', fontSize: '14px' }}
            showCount
            maxLength={(mode === 'text-to-image' || mode === 'image-to-image' || mode === 'image-edit') ? 500 : 150}
          />
          {(mode === 'text-to-video' || mode === 'image-to-video') && (
            <div style={{ fontSize: '12px', color: (() => {
              const currentInput = mode === 'text-to-video' ? textToVideoState.textInput : imageToVideoState.textInput
              return currentInput.length > 150 ? '#ff4d4f' : '#666'
            })(), marginBottom: '10px' }}>
              视频生成提示词限制150字，当前：{(() => {
                const currentInput = mode === 'text-to-video' ? textToVideoState.textInput : imageToVideoState.textInput
                return currentInput.length
              })()}/150字
            </div>
          )}
          {mode !== 'image-edit' && (
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#666', flex: 1 }}>
                💡 AI优化将根据官方建议增强运镜方式、行动逻辑和画面描述
              </div>
              <Button 
                type="default" 
                onClick={() => handleOptimizeText(mode)}
                loading={(() => {
                  switch (mode) {
                    case 'text-to-video': return textToVideoState.optimizing
                    case 'image-to-video': return imageToVideoState.optimizing  
                    case 'text-to-image': return textToImageState.optimizing
                    case 'image-to-image': return imageToImageState.optimizing
                  }
                })()}
                disabled={(() => {
                  const currentState = (() => {
                    switch (mode) {
                      case 'text-to-video': return textToVideoState
                      case 'image-to-video': return imageToVideoState  
                      case 'text-to-image': return textToImageState
                      case 'image-to-image': return imageToImageState
                    }
                  })()
                  return !currentState?.textInput.trim() || currentState?.optimizing
                })()}
              >
                {(() => {
                  const currentOptimizing = (() => {
                    switch (mode) {
                      case 'text-to-video': return textToVideoState.optimizing
                      case 'image-to-video': return imageToVideoState.optimizing  
                      case 'text-to-image': return textToImageState.optimizing
                      case 'image-to-image': return imageToImageState.optimizing
                    }
                  })()
                  return currentOptimizing ? 'AI优化中...' : 'AI优化提示词'
                })()}
              </Button>
            </div>
          )}
        </div>

        {(mode === 'text-to-video' || mode === 'image-to-video') && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label>视频尺寸比例：</label>
              {mode === 'image-to-video' && imageToVideoState.imageInfo && (
                <div style={{ fontSize: '12px', color: '#52c41a' }}>
                  ✓ 已根据图片尺寸自动选择最接近的比例
                </div>
              )}
            </div>
            <Radio.Group 
              value={aspectRatio} 
              onChange={(e) => setAspectRatio(e.target.value)}
            >
              <Radio.Button value="16:9">16:9 (1280×720)</Radio.Button>
              <Radio.Button value="9:16">9:16 (720×1280)</Radio.Button>
              <Radio.Button value="1:1">1:1 (960×960)</Radio.Button>
              <Radio.Button value="4:3">4:3 (960×720)</Radio.Button>
              <Radio.Button value="3:4">3:4 (720×960)</Radio.Button>
              <Radio.Button value="21:9">21:9 (1680×720)</Radio.Button>
            </Radio.Group>
          </div>
        )}

        {mode === 'image-to-image' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>ControlNet类型：</label>
              <Radio.Group 
                value={imageToImageState.controlnetType} 
                onChange={(e) => setImageToImageState(prev => ({ ...prev, controlnetType: e.target.value }))}
                style={{ marginBottom: '10px' }}
              >
                <Radio.Button value="depth">景深 (depth)</Radio.Button>
                <Radio.Button value="canny">轮廓边缘 (canny)</Radio.Button>
                <Radio.Button value="pose">人物姿态 (pose)</Radio.Button>
              </Radio.Group>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                💡 选择参考输入图的特征：景深适合风景，轮廓边缘适合保持形状，人物姿态适合人像
              </div>
              
              <label style={{ display: 'block', marginBottom: '8px' }}>控制强度：{imageToImageState.strength}</label>
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.1" 
                value={imageToImageState.strength}
                onChange={(e) => setImageToImageState(prev => ({ ...prev, strength: parseFloat(e.target.value) }))}
                style={{ width: '100%', marginBottom: '10px' }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                💡 数值越高，生成图片越接近原图特征；数值越低，创造性越强
              </div>
            </div>
          </>
        )}

        {(mode === 'text-to-image' || mode === 'image-to-image') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>图片尺寸比例：</label>
            <Radio.Group 
              value={imageAspectRatio} 
              onChange={(e) => setImageAspectRatio(e.target.value)}
            >
              {IMAGE_ASPECT_RATIOS.map(ratio => (
                <Radio.Button key={ratio.ratio} value={ratio.ratio}>
                  {ratio.label}
                </Radio.Button>
              ))}
            </Radio.Group>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              💡 建议使用512附近的尺寸获得最佳效果，避免过大差距导致延迟增加
              {mode === 'image-to-image' && <span><br/>🔧 图生图输出尺寸与输入图一致，此设置仅影响处理过程</span>}
            </div>
          </div>
        )}

        <Button 
          type="primary" 
          onClick={handleGenerate}
          loading={(() => {
            switch (mode) {
              case 'text-to-video': return textToVideoState.loading
              case 'image-to-video': return imageToVideoState.loading  
              case 'text-to-image': return textToImageState.loading
              case 'image-to-image': return imageToImageState.loading
              case 'image-edit': return imageEditState.loading
            }
          })()}
          disabled={(() => {
            switch (mode) {
              case 'text-to-video': return textToVideoState.loading
              case 'image-to-video': return imageToVideoState.loading  
              case 'text-to-image': return textToImageState.loading
              case 'image-to-image': return imageToImageState.loading
              case 'image-edit': return imageEditState.loading
            }
          })()}
          size="large"
        >
          {(() => {
            const currentLoading = (() => {
              switch (mode) {
                case 'text-to-video': return textToVideoState.loading
                case 'image-to-video': return imageToVideoState.loading  
                case 'text-to-image': return textToImageState.loading
                case 'image-to-image': return imageToImageState.loading
                case 'image-edit': return imageEditState.loading
              }
            })()
            return currentLoading ? '生成中...' : '开始生成'
          })()}
        </Button>
      </Card>

      {(() => {
        const getCurrentState = () => {
          switch (mode) {
            case 'text-to-video': return textToVideoState
            case 'image-to-video': return imageToVideoState  
            case 'text-to-image': return textToImageState
            case 'image-to-image': return imageToImageState
            case 'image-edit': return imageEditState
          }
        }
        const currentState = getCurrentState()
        return currentState?.result
      })() && (
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
          {(() => {
            const getCurrentState = () => {
              switch (mode) {
                case 'text-to-video': return textToVideoState
                case 'image-to-video': return imageToVideoState  
                case 'text-to-image': return textToImageState
                case 'image-to-image': return imageToImageState
                case 'image-edit': return imageEditState
              }
            }
            const currentState = getCurrentState()
            const result = currentState?.result!
            
            return result.type === 'image' ? (
              <div>
                <Image
                  src={result.url}
                  alt="生成的图片"
                  style={{ maxWidth: '100%' }}
                />
                {(mode === 'image-to-image' || mode === 'image-edit') && result.description && (
                  <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>AI 生成描述：</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                      {result.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <video
                src={result.url.startsWith('http') ? `http://localhost:5000/api/video-proxy?url=${encodeURIComponent(result.url)}` : result.url}
                controls
                style={{ maxWidth: '100%' }}
                onError={(e) => {
                  console.error('视频播放错误:', e)
                  message.error('视频播放失败')
                }}
              >
                您的浏览器不支持视频播放
              </video>
            )
          })()}
        </Card>
      )}

      {(() => {
        const getCurrentState = () => {
          switch (mode) {
            case 'text-to-video': return textToVideoState
            case 'image-to-video': return imageToVideoState  
            case 'text-to-image': return textToImageState
            case 'image-to-image': return imageToImageState
            case 'image-edit': return imageEditState
          }
        }
        const currentState = getCurrentState()
        return currentState?.loading
      })() && (
        <Card style={{ textAlign: 'center', marginTop: '20px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '10px', fontSize: '16px', fontWeight: '500' }}>
            {(() => {
              switch (mode) {
                case 'text-to-video': return textToVideoState.statusMessage
                case 'image-to-video': return imageToVideoState.statusMessage  
                case 'text-to-image': return '正在进行文生图...'
                case 'image-to-image': return '正在进行图生图...'
                case 'image-edit': return imageEditState.statusMessage
              }
            })()}
          </p>
          {(() => {
            switch (mode) {
              case 'text-to-video': return textToVideoState.checkCount > 0
              case 'image-to-video': return imageToVideoState.checkCount > 0
              case 'text-to-image': return false
              case 'image-to-image': return false
              case 'image-edit': return imageEditState.checkCount > 0
            }
          })() && (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              已检查 {(() => {
                switch (mode) {
                  case 'text-to-video': return textToVideoState.checkCount
                  case 'image-to-video': return imageToVideoState.checkCount
                  case 'text-to-image': return 0
                  case 'image-to-image': return 0
                  case 'image-edit': return imageEditState.checkCount
                }
              })()} 次，每3秒自动检查一次状态
            </p>
          )}
        </Card>
      )}

    </div>
  )
}

export default App
