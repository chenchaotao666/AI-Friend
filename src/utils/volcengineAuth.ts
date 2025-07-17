import CryptoJS from 'crypto-js'
import { API_CONFIG } from '../config'

export interface VolcengineSignature {
  headers: {
    'Content-Type': string
    'Authorization': string
    'X-Date': string
    'X-Content-Sha256': string
  }
}

export function generateVolcengineSignature(
  method: string,
  path: string,
  query: string,
  body: string
): VolcengineSignature {
  const accessKey = API_CONFIG.VOLCENGINE_ACCESS_KEY
  const secretKey = API_CONFIG.VOLCENGINE_SECRET_KEY
  const region = API_CONFIG.VOLCENGINE_REGION
  const service = API_CONFIG.VOLCENGINE_SERVICE
  
  if (!accessKey || !secretKey) {
    throw new Error('火山引擎认证信息缺失，请配置 VITE_VOLCENGINE_ACCESS_KEY 和 VITE_VOLCENGINE_SECRET_KEY。请参考README获取认证信息。')
  }

  // 创建时间戳
  const now = new Date()
  const isoDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '')
  const dateStamp = isoDate.substring(0, 8)

  // 计算content sha256
  const contentSha256 = CryptoJS.SHA256(body).toString()

  // 创建规范请求
  const canonicalHeaders = [
    'content-type:application/json',
    `host:visual.volcengineapi.com`,
    `x-content-sha256:${contentSha256}`,
    `x-date:${isoDate}`
  ].join('\n')

  const signedHeaders = 'content-type;host;x-content-sha256;x-date'

  const canonicalRequest = [
    method,
    path,
    query,
    canonicalHeaders,
    '',
    signedHeaders,
    contentSha256
  ].join('\n')

  // 创建待签名字符串
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    algorithm,
    isoDate,
    credentialScope,
    CryptoJS.SHA256(canonicalRequest).toString()
  ].join('\n')

  // 计算签名
  const signingKey = getSignatureKey(secretKey, dateStamp, region, service)
  const signature = CryptoJS.HmacSHA256(stringToSign, signingKey).toString()

  // 构建Authorization header
  const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authorizationHeader,
      'X-Date': isoDate,
      'X-Content-Sha256': contentSha256
    }
  }
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): CryptoJS.lib.WordArray {
  const kDate = CryptoJS.HmacSHA256(dateStamp, 'AWS4' + key)
  const kRegion = CryptoJS.HmacSHA256(regionName, kDate)
  const kService = CryptoJS.HmacSHA256(serviceName, kRegion)
  const kSigning = CryptoJS.HmacSHA256('aws4_request', kService)
  return kSigning
}