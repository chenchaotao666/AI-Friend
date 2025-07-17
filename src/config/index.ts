export const API_CONFIG = {
  DEEPSEEK_API_KEY: import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-43fc565dd627428db42a1325b24886bd',
  JIMENG_API_BASE: 'https://visual.volcengineapi.com',
  DEEPSEEK_API_BASE: 'https://api.deepseek.com/v1',
  // 火山引擎认证信息
  VOLCENGINE_ACCESS_KEY: import.meta.env.VITE_VOLCENGINE_ACCESS_KEY || '',
  VOLCENGINE_SECRET_KEY: import.meta.env.VITE_VOLCENGINE_SECRET_KEY || '',
  VOLCENGINE_REGION: 'cn-north-1',
  VOLCENGINE_SERVICE: 'cv',
}

export const GENERATION_CONFIG = {
  TEXT_TO_VIDEO: {
    DEFAULT_DURATION: 5,
    DEFAULT_RESOLUTION: '1024x576',
  },
  IMAGE_TO_VIDEO: {
    DEFAULT_DURATION: 5,
    DEFAULT_RESOLUTION: '1024x576',
  },
  IMAGE_GENERATION: {
    DEFAULT_RESOLUTION: '1024x1024',
    DEFAULT_STYLE: 'general',
  },
}

export const FILE_CONFIG = {
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}