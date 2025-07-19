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
  let secretKey = API_CONFIG.VOLCENGINE_SECRET_KEY
  const region = API_CONFIG.VOLCENGINE_REGION
  const service = API_CONFIG.VOLCENGINE_SERVICE
  
  if (!accessKey || !secretKey) {
    throw new Error('火山引擎认证信息缺失，请配置 VITE_VOLCENGINE_ACCESS_KEY 和 VITE_VOLCENGINE_SECRET_KEY。请参考README获取认证信息。')
  }

  // 解码Base64格式的secret key
  try {
    let decodedKey = atob(secretKey)
    console.log('First decode - length:', decodedKey.length)
    console.log('First decode - first 10 chars:', decodedKey.substring(0, 10))
    
    // 检查是否需要再次解码
    if (decodedKey.length > 40 || !/^[0-9a-fA-F]+$/.test(decodedKey)) {
      try {
        const secondDecode = atob(decodedKey)
        console.log('Second decode - length:', secondDecode.length)
        console.log('Second decode - first 10 chars:', secondDecode.substring(0, 10))
        console.log('Second decode is hex?', /^[0-9a-fA-F]+$/.test(secondDecode))
        decodedKey = secondDecode
      } catch (e) {
        console.log('No second decode needed')
      }
    }
    
    secretKey = decodedKey
  } catch (error) {
    console.warn('Secret key is not Base64 encoded, using as-is')
  }
  
  console.log('Access Key:', accessKey)
  console.log('Final Secret Key first 10 chars:', secretKey.substring(0, 10))
  console.log('Region:', region)
  console.log('Service:', service)

  // 创建时间戳，按照官方Go代码格式
  const now = new Date()
  const isoDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '')
  const dateStamp = isoDate.substring(0, 8)
  
  console.log('ISO Date:', isoDate)
  console.log('Date Stamp:', dateStamp)

  // 计算content sha256
  const contentSha256 = CryptoJS.SHA256(body).toString()
  console.log('Body length:', body.length)
  console.log('Body first 50 chars:', body.substring(0, 50))
  console.log('Content SHA256:', contentSha256)

  // 创建规范请求 - 按照官方Python代码的顺序
  const canonicalHeaders = [
    'content-type:application/json',
    `host:visual.volcengineapi.com`,
    `x-content-sha256:${contentSha256}`,
    `x-date:${isoDate}`
  ].join('\n') + '\n'
  
  console.log('Canonical Headers:', canonicalHeaders)

  const signedHeaders = 'content-type;host;x-content-sha256;x-date'

  // 对查询参数进行排序，但不进行额外的编码转换
  const sortedQuery = query.split('&').sort().join('&')
  console.log('Original Query:', query)
  console.log('Sorted Query:', sortedQuery)
  
  // 按照Python代码的方式构建canonical request
  // Python: method + '\n' + canonical_uri + '\n' + canonical_querystring + '\n' + canonical_headers + '\n' + signed_headers + '\n' + payload_hash
  const canonicalRequest = method + '\n' + path + '\n' + sortedQuery + '\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + contentSha256
  
  // 对比官方Python代码中的canonicalString构建方式
  console.log('Canonical request parts:')
  console.log('1. Method:', method)
  console.log('2. Path:', path)
  console.log('3. Query:', sortedQuery)
  console.log('4. Headers with newline:', JSON.stringify(canonicalHeaders))
  console.log('5. Signed headers:', signedHeaders)
  console.log('6. Payload hash:', contentSha256)
  
  console.log('Full canonical request:')
  console.log(JSON.stringify(canonicalRequest))

  // 创建待签名字符串 - 按照官方Python代码
  const algorithm = 'HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/${service}/request`
  const stringToSign = algorithm + '\n' + isoDate + '\n' + credentialScope + '\n' + CryptoJS.SHA256(canonicalRequest).toString()

  // 计算签名
  const signingKey = getSignatureKey(secretKey, dateStamp, region, service)
  const signature = CryptoJS.HmacSHA256(stringToSign, signingKey).toString()

  // 构建Authorization header
  const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  console.log('Canonical Request:', canonicalRequest)
  console.log('String To Sign:', stringToSign)
  console.log('Authorization Header:', authorizationHeader)

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
  console.log('Signature key generation (Python style):')
  console.log('- Key:', key.substring(0, 10) + '...')
  console.log('- Date:', dateStamp)
  console.log('- Region:', regionName)
  console.log('- Service:', serviceName)
  
  // 按照Python代码的方式：sign(key.encode('utf-8'), dateStamp)
  const kDate = CryptoJS.HmacSHA256(dateStamp, CryptoJS.enc.Utf8.parse(key))
  console.log('- kDate:', kDate.toString())
  
  const kRegion = CryptoJS.HmacSHA256(regionName, kDate)
  console.log('- kRegion:', kRegion.toString())
  
  const kService = CryptoJS.HmacSHA256(serviceName, kRegion)
  console.log('- kService:', kService.toString())
  
  const kSigning = CryptoJS.HmacSHA256('request', kService)
  console.log('- kSigning:', kSigning.toString())
  
  return kSigning
}