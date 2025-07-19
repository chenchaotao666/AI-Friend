from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import json
import hashlib
import hmac
import base64
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# VolcEngine配置
VOLCENGINE_ACCESS_KEY = os.getenv('VOLCENGINE_ACCESS_KEY')
VOLCENGINE_SECRET_KEY = os.getenv('VOLCENGINE_SECRET_KEY')
VOLCENGINE_REGION = 'cn-beijing'
VOLCENGINE_SERVICE = 'cv'
VOLCENGINE_HOST = 'visual.volcengineapi.com'

def sign(key, msg):
    """HMAC-SHA256签名 - 按照官方实现"""
    return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

def get_signature_key(key, date_stamp, region_name, service_name):
    """生成签名密钥 - 按照官方实现"""
    k_date = sign(key.encode('utf-8'), date_stamp)
    k_region = sign(k_date, region_name)
    k_service = sign(k_region, service_name)
    k_signing = sign(k_service, 'request')
    return k_signing

def generate_volcengine_signature(method, path, query_string, body):
    """生成VolcEngine API签名 - 按照官方实现"""
    
    # 直接使用Secret Key，不进行Base64解码
    secret_key = VOLCENGINE_SECRET_KEY
    
    # 创建时间戳 - 使用UTC时间，按照官方实现
    t = datetime.now(timezone.utc)
    current_date = t.strftime('%Y%m%dT%H%M%SZ')
    datestamp = t.strftime('%Y%m%d')
    
    # 计算body的SHA256
    payload_hash = hashlib.sha256(body.encode('utf-8')).hexdigest()
    
    # 构建规范头部 - 按照官方实现
    canonical_uri = '/'
    # 对查询参数进行排序处理，按照官方实现
    query_params = {}
    for param in query_string.split('&'):
        if '=' in param:
            key, value = param.split('=', 1)
            query_params[key] = value
    
    # 重新构建排序后的查询字符串
    canonical_querystring = ''
    for key in sorted(query_params):
        canonical_querystring += key + '=' + query_params[key] + '&'
    canonical_querystring = canonical_querystring[:-1] if canonical_querystring else ''
    signed_headers = 'host;x-content-sha256;x-date'
    content_type = 'application/json'
    canonical_headers = (
        'host:' + VOLCENGINE_HOST + '\n' + 
        'x-content-sha256:' + payload_hash + '\n' + 
        'x-date:' + current_date + '\n'
    )
    
    # 构建规范请求 - 按照官方实现
    canonical_request = (
        method + '\n' + 
        canonical_uri + '\n' + 
        canonical_querystring + '\n' + 
        canonical_headers + '\n' + 
        signed_headers + '\n' + 
        payload_hash
    )
    
    # 构建待签名字符串 - 按照官方实现
    algorithm = 'HMAC-SHA256'
    credential_scope = datestamp + '/' + VOLCENGINE_REGION + '/' + VOLCENGINE_SERVICE + '/' + 'request'
    string_to_sign = (
        algorithm + '\n' + 
        current_date + '\n' + 
        credential_scope + '\n' + 
        hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()
    )
    
    # 计算签名 - 按照官方实现
    signing_key = get_signature_key(secret_key, datestamp, VOLCENGINE_REGION, VOLCENGINE_SERVICE)
    signature = hmac.new(signing_key, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()
    
    # 构建Authorization头部 - 按照官方实现
    authorization_header = (
        algorithm + ' ' + 
        'Credential=' + VOLCENGINE_ACCESS_KEY + '/' + credential_scope + ', ' + 
        'SignedHeaders=' + signed_headers + ', ' + 
        'Signature=' + signature
    )
    
    # 调试信息
    print("=== 签名调试信息 ===")
    print(f"Canonical Request:\n{canonical_request}")
    print(f"String to Sign:\n{string_to_sign}")
    print(f"Signature: {signature}")
    print(f"Authorization: {authorization_header}")
    print("==================")
    
    return {
        'X-Date': current_date,
        'Authorization': authorization_header,
        'X-Content-Sha256': payload_hash,
        'Content-Type': content_type
    }

@app.route('/api/volcengine', methods=['POST'])
def volcengine_proxy():
    """VolcEngine API代理"""
    try:
        # 获取查询参数
        query_string = request.query_string.decode('utf-8')
        
        # 获取请求体
        body = request.get_data(as_text=True)
        
        # 生成签名
        headers = generate_volcengine_signature('POST', '/', query_string, body)
        
        # 构建请求URL
        url = f'https://{VOLCENGINE_HOST}/?{query_string}'
        
        # 发送请求到VolcEngine
        response = requests.post(url, headers=headers, data=body)
        
        # 返回响应
        return jsonify(response.json()), response.status_code
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/text-to-video', methods=['POST'])
def text_to_video():
    """文本生成视频"""
    try:
        data = request.get_json()
        print(f"=== 文本生成视频请求 ===")
        print(f"请求数据: {data}")
        
        request_body = {
            "req_key": "jimeng_vgfm_t2v_l20",
            "prompt": data.get('prompt', ''),
            "aspect_ratio": data.get('aspect_ratio', '16:9')
        }
        
        body = json.dumps(request_body)
        query_string = 'Action=JimengVGFMT2VL20SubmitTask&Version=2024-06-06'
        print(f"请求体: {body}")
        print(f"查询字符串: {query_string}")
        
        # 生成签名
        headers = generate_volcengine_signature('POST', '/', query_string, body)
        
        # 构建请求URL
        url = f'https://{VOLCENGINE_HOST}/?{query_string}'
        
        # 发送请求到VolcEngine
        response = requests.post(url, headers=headers, data=body)
        response_data = response.json()
        
        # 处理响应
        if response_data.get('ResponseMetadata', {}).get('Error'):
            error_msg = response_data['ResponseMetadata']['Error']['Message']
            return jsonify({'success': False, 'error': error_msg}), 400
        
        # 从正确的路径获取task_id
        result = response_data.get('Result', {})
        task_id = result.get('data', {}).get('task_id', '')
        print(f"文生视频生成的task_id: {task_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'task_id': task_id,
                'status': 'pending'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/image-to-video', methods=['POST'])
def image_to_video():
    """图像生成视频"""
    try:
        data = request.get_json()
        print(f"=== 图像生成视频请求 ===")
        print(f"请求数据: {data}")
        
        image_base64 = data.get('imageBase64', '')
        print(f"图片base64长度: {len(image_base64)}")
        print(f"图片base64前100字符: {image_base64[:100] if image_base64 else 'None'}")
        
        request_body = {
            "req_key": "jimeng_vgfm_i2v_l20",
            "prompt": data.get('prompt', ''),
            "binary_data_base64": [image_base64],
            "aspect_ratio": data.get('aspect_ratio', '16:9')
        }
        
        body = json.dumps(request_body)
        query_string = 'Action=JimengVGFMI2VL20SubmitTask&Version=2024-06-06'
        print(f"请求体长度: {len(body)}")
        print(f"查询字符串: {query_string}")
        
        # 生成签名
        headers = generate_volcengine_signature('POST', '/', query_string, body)
        
        # 构建请求URL
        url = f'https://{VOLCENGINE_HOST}/?{query_string}'
        
        # 发送请求到VolcEngine
        print(f"图生视频发送请求到: {url}")
        response = requests.post(url, headers=headers, data=body)
        response_data = response.json()
        print(f"图生视频API响应: {response_data}")
        
        # 处理响应
        if response_data.get('ResponseMetadata', {}).get('Error'):
            error_msg = response_data['ResponseMetadata']['Error']['Message']
            print(f"图生视频API错误: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 400
        
        # 从正确的路径获取task_id
        result = response_data.get('Result', {})
        task_id = result.get('data', {}).get('task_id', '')
        print(f"图生视频生成的task_id: {task_id}")
        print(f"完整Result数据: {result}")
        
        return jsonify({
            'success': True,
            'data': {
                'task_id': task_id,
                'status': 'pending'
            }
        })
        
    except Exception as e:
        print(f"图像生成视频异常: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/check-status', methods=['POST'])
def check_status():
    """检查任务状态"""
    try:
        data = request.get_json()
        task_id = data.get('task_id')
        print(f"=== 检查任务状态 ===")
        print(f"请求数据: {data}")
        print(f"task_id: {task_id}")
        
        if not task_id:
            print("错误: task_id为空")
            return jsonify({'success': False, 'error': 'task_id is required'}), 400
        
        request_body = {
            "req_key": "jimeng_vgfm_t2v_l20",
            "task_id": task_id
        }
        print(f"查询请求体: {request_body}")
        
        body = json.dumps(request_body)
        query_string = 'Action=JimengVGFMT2VL20GetResult&Version=2024-06-06'
        
        # 生成签名
        headers = generate_volcengine_signature('POST', '/', query_string, body)
        
        # 构建请求URL
        url = f'https://{VOLCENGINE_HOST}/?{query_string}'
        
        # 发送请求到VolcEngine
        print(f"查询状态URL: {url}")
        response = requests.post(url, headers=headers, data=body)
        response_data = response.json()
        print(f"状态查询响应: {response_data}")
        
        # 处理响应
        if response_data.get('ResponseMetadata', {}).get('Error'):
            error_msg = response_data['ResponseMetadata']['Error']['Message']
            print(f"状态查询错误: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 400
        
        # 从正确的路径获取状态信息
        result = response_data.get('Result', {})
        result_data = result.get('data', {})
        status = result_data.get('status', 'processing')
        video_url = result_data.get('video_url')
        print(f"任务状态: {status}, 视频URL: {video_url}")
        print(f"完整状态数据: {result_data}")
        
        if status == 'done' and video_url:
            return jsonify({
                'success': True,
                'data': {
                    'task_id': task_id,
                    'status': 'done',
                    'video_url': video_url,
                    'result': {
                        'type': 'video',
                        'url': video_url
                    }
                }
            })
        else:
            return jsonify({
                'success': True,
                'data': {
                    'task_id': task_id,
                    'status': status
                }
            })
        
    except Exception as e:
        print(f"检查状态异常: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/text-to-image', methods=['POST'])
def text_to_image():
    """文生图"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        request_body = {
            "req_key": "jimeng_high_aes_general_v21_L",
            "prompt": prompt,
            "width": data.get('width', 512),
            "height": data.get('height', 512),
            "seed": -1,
            "return_url": True,
            "use_pre_llm": len(prompt) <= 30,
        }
        
        body = json.dumps(request_body)
        query_string = 'Action=JimengHighAESGeneralV21L&Version=2024-06-06'
        
        # 生成签名
        headers = generate_volcengine_signature('POST', '/', query_string, body)
        
        # 构建请求URL
        url = f'https://{VOLCENGINE_HOST}/?{query_string}'
        
        # 发送请求到VolcEngine
        response = requests.post(url, headers=headers, data=body)
        response_data = response.json()

        print(f"图片生成API响应: {response_data}")
        
        # 处理响应
        if response_data.get('ResponseMetadata', {}).get('Error'):
            error_msg = response_data['ResponseMetadata']['Error']['Message']
            return jsonify({'success': False, 'error': error_msg}), 400
        
        result_data = response_data.get('Result', {}).get('data', {})
        image_url = result_data.get('image_urls', [''])[0]
        
        return jsonify({
            'success': True,
            'data': {
                'task_id': f'img_{int(datetime.now().timestamp() * 1000)}',
                'status': 'done',
                'result': {
                    'type': 'image',
                    'url': image_url
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/video-proxy', methods=['GET'])
def video_proxy():
    """视频代理接口"""
    try:
        video_url = request.args.get('url')
        filename = request.args.get('filename', 'generated-video.mp4')
        download = request.args.get('download', 'false').lower() == 'true'
        
        print(f"=== 视频代理请求 ===")
        print(f"视频URL: {video_url}")
        print(f"文件名: {filename}")
        print(f"下载模式: {download}")
        
        if not video_url:
            return jsonify({'error': 'Missing video URL'}), 400
        
        # 设置适当的请求头
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://jimeng.jd.com/',  # 模拟从官方网站访问
            'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
        }
        
        # 请求视频
        response = requests.get(video_url, headers=headers, stream=True)
        
        if response.status_code == 200:
            # 返回视频流
            def generate():
                for chunk in response.iter_content(chunk_size=8192):
                    yield chunk
            
            response_headers = {
                'Accept-Ranges': 'bytes',
                'Content-Length': response.headers.get('content-length'),
                'Cache-Control': 'no-cache'
            }
            
            # 如果是下载模式，添加attachment头部
            if download:
                response_headers['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return Response(
                generate(),
                content_type=response.headers.get('content-type', 'video/mp4'),
                headers=response_headers
            )
        else:
            return jsonify({'error': f'Video request failed: {response.status_code}'}), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/image-to-image', methods=['POST'])
def image_to_image():
    """图生图 - 基于字节跳动高美感2.0模型的可控图生图"""
    try:
        data = request.get_json()
        
        image_base64 = data.get('imageBase64', '')
        prompt = data.get('prompt', '')
        controlnet_type = data.get('controlnet_type', 'depth')  # canny、depth、pose
        strength = data.get('strength', 0.6)
        
        if not image_base64:
            return jsonify({'success': False, 'error': '请提供图片数据'}), 400
            
        # 使用VolcEngine的图生图API（CVProcess接口）
        request_body = {
            "req_key": "high_aes_scheduler_svr_controlnet_v2.0",
            "prompt": prompt if prompt else "保持原图风格，生成新的图片",
            "binary_data_base64": [image_base64],
            "controlnet_args": [
                {
                    "type": controlnet_type,  # canny（轮廓边缘）、depth（景深）、pose（人物姿态）
                    "binary_data_index": 0,
                    "strength": strength  # ControlNet强度 (0.0, 1.0]
                }
            ],
            "seed": -1,
            "scale": 3.0,  # 影响文本描述的程度 [1, 30]
            "ddim_steps": 16,  # 生成图像的步数 [1, 50]
            "use_rephraser": len(prompt) < 50 if prompt else True,  # 短提示词开启扩写
            "return_url": True,
            "logo_info": {
                "add_logo": False
            }
        }
        
        body = json.dumps(request_body)
        query_string = 'Action=CVProcess&Version=2022-08-31'
        
        print(f"图生图请求体: {body}")
        print(f"查询字符串: {query_string}")
        
        # 生成签名
        headers = generate_volcengine_signature('POST', '/', query_string, body)
        
        # 构建请求URL
        url = f'https://{VOLCENGINE_HOST}/?{query_string}'
        
        # 发送请求到VolcEngine
        response = requests.post(url, headers=headers, data=body)
        response_data = response.json()
        
        print(f"图生图API响应: {response_data}")
        
        # 处理响应
        if response_data.get('ResponseMetadata', {}).get('Error'):
            error_msg = response_data['ResponseMetadata']['Error']['Message']
            return jsonify({'success': False, 'error': error_msg}), 400
        
        # 检查业务错误码
        if response_data.get('code') != 10000:
            error_msg = response_data.get('message', '图生图处理失败')
            return jsonify({'success': False, 'error': error_msg}), 400
            
        result_data = response_data.get('data', {})
        image_urls = result_data.get('image_urls', [])
        image_url = image_urls[0] if image_urls else ''
        description = result_data.get('rephraser_result', '')  # 扩写后的提示词作为描述
        
        if not image_url:
            return jsonify({'success': False, 'error': '未获取到生成的图片'}), 400
        
        return jsonify({
            'success': True,
            'data': {
                'task_id': f'img2img_{int(datetime.now().timestamp() * 1000)}',
                'status': 'done',
                'result': {
                    'type': 'image',
                    'url': image_url,
                    'description': description
                }
            }
        })
        
    except Exception as e:
        print(f"图生图异常: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/image-edit', methods=['POST'])
def image_edit():
    """图片修改 - 基于seededit_v3.0的异步图片编辑"""
    try:
        data = request.get_json()
        print(f"=== 图片修改请求 ===")
        print(f"请求数据: {data}")
        
        image_base64 = data.get('imageBase64', '')
        prompt = data.get('prompt', '')
        strength = data.get('strength', 0.5)
        
        if not image_base64:
            return jsonify({'success': False, 'error': '请提供图片数据'}), 400
            
        if not prompt:
            return jsonify({'success': False, 'error': '请提供编辑描述'}), 400
            
        # 使用VolcEngine的新版图片编辑API (seededit_v3.0)
        request_body = {
            "req_key": "seededit_v3.0",
            "binary_data_base64": [image_base64],
            "prompt": prompt,
            "seed": -1,
            "scale": strength  # 使用用户设置的强度
        }
        
        body = json.dumps(request_body)
        query_string = 'Action=CVSync2AsyncSubmitTask&Version=2022-08-31'
        
        print(f"图片修改请求体: {body}")
        print(f"查询字符串: {query_string}")
        
        # 生成签名
        headers = generate_volcengine_signature('POST', '/', query_string, body)
        
        # 构建请求URL
        url = f'https://{VOLCENGINE_HOST}/?{query_string}'
        
        # 发送请求到VolcEngine
        response = requests.post(url, headers=headers, data=body)
        response_data = response.json()
        
        print(f"图片修改API响应: {response_data}")
        
        # 处理响应
        if response_data.get('ResponseMetadata', {}).get('Error'):
            error_msg = response_data['ResponseMetadata']['Error']['Message']
            return jsonify({'success': False, 'error': error_msg}), 400
        
        # 检查业务错误码
        if response_data.get('code') != 10000:
            error_msg = response_data.get('message', '图片修改任务提交失败')
            return jsonify({'success': False, 'error': error_msg}), 400
            
        # 获取任务ID
        task_id = response_data.get('data', {}).get('task_id', '')
        if not task_id:
            return jsonify({'success': False, 'error': '未获取到任务ID'}), 400
        
        print(f"图片修改生成的task_id: {task_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'task_id': task_id,
                'status': 'pending'
            }
        })
        
    except Exception as e:
        print(f"图片修改异常: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/image-edit-status', methods=['POST'])
def image_edit_status():
    """查询图片修改任务状态"""
    try:
        data = request.get_json()
        task_id = data.get('task_id')
        print(f"=== 查询图片修改任务状态 ===")
        print(f"task_id: {task_id}")
        
        if not task_id:
            return jsonify({'success': False, 'error': 'task_id is required'}), 400
        
        # 使用seededit_v3.0的查询接口
        request_body = {
            "req_key": "seededit_v3.0",
            "task_id": task_id,
            "req_json": json.dumps({
                "return_url": True,
                "logo_info": {
                    "add_logo": False
                }
            })
        }
        
        body = json.dumps(request_body)
        query_string = 'Action=CVSync2AsyncGetResult&Version=2022-08-31'
        
        print(f"图片修改状态查询请求体: {body}")
        
        # 生成签名
        headers = generate_volcengine_signature('POST', '/', query_string, body)
        
        # 构建请求URL
        url = f'https://{VOLCENGINE_HOST}/?{query_string}'
        
        # 发送请求到VolcEngine
        response = requests.post(url, headers=headers, data=body)
        response_data = response.json()
        
        print(f"图片修改状态查询响应: {response_data}")
        
        # 处理响应
        if response_data.get('ResponseMetadata', {}).get('Error'):
            error_msg = response_data['ResponseMetadata']['Error']['Message']
            return jsonify({'success': False, 'error': error_msg}), 400
        
        # 检查业务错误码
        if response_data.get('code') != 10000:
            error_msg = response_data.get('message', '状态查询失败')
            return jsonify({'success': False, 'error': error_msg}), 400
            
        result_data = response_data.get('data', {})
        status = result_data.get('status', 'processing')
        image_urls = result_data.get('image_urls', [])
        
        print(f"任务状态: {status}")
        print(f"图片URLs: {image_urls}")
        
        if status == 'done' and image_urls:
            image_url = image_urls[0]
            return jsonify({
                'success': True,
                'data': {
                    'task_id': task_id,
                    'status': 'done',
                    'result': {
                        'type': 'image',
                        'url': image_url
                    }
                }
            })
        elif status == 'not_found':
            return jsonify({'success': False, 'error': '任务未找到或已过期'}), 400
        elif status == 'expired':
            return jsonify({'success': False, 'error': '任务已过期，请重新提交'}), 400
        else:
            # in_queue, generating 等状态
            status_map = {
                'in_queue': '任务已提交，排队等待中',
                'generating': '正在处理中'
            }
            return jsonify({
                'success': True,
                'data': {
                    'task_id': task_id,
                    'status': status,
                    'statusMessage': status_map.get(status, f'当前状态: {status}')
                }
            })
        
    except Exception as e:
        print(f"查询图片修改状态异常: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/image-proxy', methods=['GET'])
def image_proxy():
    """图片代理下载接口"""
    try:
        image_url = request.args.get('url')
        filename = request.args.get('filename', 'generated-image.png')
        
        if not image_url:
            return jsonify({'error': 'Missing image URL'}), 400
        
        # 设置适当的请求头
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://jimeng.jd.com/',  # 模拟从官方网站访问
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        }
        
        # 请求图片
        response = requests.get(image_url, headers=headers, stream=True)
        
        if response.status_code == 200:
            # 从URL推断文件类型
            content_type = response.headers.get('content-type', 'image/png')
            
            # 返回图片流
            def generate():
                for chunk in response.iter_content(chunk_size=8192):
                    yield chunk
            
            return Response(
                generate(),
                content_type=content_type,
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Content-Length': response.headers.get('content-length'),
                    'Cache-Control': 'no-cache'
                }
            )
        else:
            return jsonify({'error': f'Image request failed: {response.status_code}'}), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)