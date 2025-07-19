export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function downloadFile(url: string, filename: string) {
  console.log('下载文件:', { url, filename })
  
  const link = document.createElement('a')
  
  // 检查是否是图片文件（通过文件名扩展名或URL特征判断）
  const isImage = filename.match(/\.(png|jpg|jpeg|webp|gif)$/i) || 
                 url.includes('image') || 
                 url.includes('.png') || 
                 url.includes('.jpg') || 
                 url.includes('.jpeg') ||
                 url.includes('.webp')
  
  console.log('是否为图片:', isImage)
  
  if (isImage) {
    // 使用后端代理下载图片，传递文件名参数
    const proxyUrl = `http://localhost:5000/api/image-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`
    console.log('使用图片代理下载:', proxyUrl)
    link.href = proxyUrl
  } else {
    // 视频文件通过代理下载
    if (url.startsWith('http') && !url.startsWith('http://localhost:5000')) {
      const proxyUrl = `http://localhost:5000/api/video-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&download=true`
      console.log('使用视频代理下载:', proxyUrl)
      link.href = proxyUrl
    } else {
      console.log('直接下载:', url)
      link.href = url
    }
  }
  
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function validateImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return validTypes.includes(file.type)
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

// 标准比例配置
const ASPECT_RATIOS = [
  { ratio: '16:9', value: 16/9, label: '16:9 (1280×720)' },
  { ratio: '9:16', value: 9/16, label: '9:16 (720×1280)' },
  { ratio: '1:1', value: 1/1, label: '1:1 (960×960)' },
  { ratio: '4:3', value: 4/3, label: '4:3 (960×720)' },
  { ratio: '3:4', value: 3/4, label: '3:4 (720×960)' },
  { ratio: '21:9', value: 21/9, label: '21:9 (1680×720)' }
] as const

export type AspectRatioType = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9'

// 图片生成的尺寸配置（根据官方建议）
export const IMAGE_ASPECT_RATIOS = [
  { ratio: '1:1', width: 512, height: 512, label: '1:1 (512×512)' },
  { ratio: '4:3', width: 512, height: 384, label: '4:3 (512×384)' },
  { ratio: '3:4', width: 384, height: 512, label: '3:4 (384×512)' },
  { ratio: '3:2', width: 512, height: 341, label: '3:2 (512×341)' },
  { ratio: '2:3', width: 341, height: 512, label: '2:3 (341×512)' },
  { ratio: '16:9', width: 512, height: 288, label: '16:9 (512×288)' },
  { ratio: '9:16', width: 288, height: 512, label: '9:16 (288×512)' }
] as const

export type ImageAspectRatioType = '1:1' | '4:3' | '3:4' | '3:2' | '2:3' | '16:9' | '9:16'

// 检测图片尺寸并返回最接近的比例
export function detectImageAspectRatio(file: File): Promise<{
  width: number
  height: number
  aspectRatio: number
  closestRatio: AspectRatioType
  difference: number
}> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const width = img.width
      const height = img.height
      const imageRatio = width / height
      
      // 找到最接近的标准比例
      let closestRatio: typeof ASPECT_RATIOS[number] = ASPECT_RATIOS[0]
      let minDifference = Math.abs(imageRatio - ASPECT_RATIOS[0].value)
      
      ASPECT_RATIOS.forEach(standardRatio => {
        const difference = Math.abs(imageRatio - standardRatio.value)
        if (difference < minDifference) {
          minDifference = difference
          closestRatio = standardRatio
        }
      })
      
      resolve({
        width,
        height,
        aspectRatio: imageRatio,
        closestRatio: closestRatio.ratio,
        difference: minDifference
      })
      
      // 清理对象URL
      URL.revokeObjectURL(img.src)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('无法读取图片尺寸'))
    }
    
    // 创建对象URL来读取图片
    img.src = URL.createObjectURL(file)
  })
}