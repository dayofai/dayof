#!/usr/bin/env python3
"""
Convert Postman collection to Posting.sh format
"""
import json
import os
import re
from pathlib import Path


def sanitize_filename(name):
    """Convert a request name to a valid filename"""
    # Remove or replace invalid characters
    name = re.sub(r'[^\w\s-]', '', name)
    # Replace spaces with underscores
    name = re.sub(r'\s+', '_', name)
    # Convert to lowercase
    name = name.lower()
    return name


def convert_body(postman_body):
    """Convert Postman body format to Posting.sh format"""
    if not postman_body:
        return None
    
    body = {}
    mode = postman_body.get('mode', 'raw')
    
    if mode == 'raw':
        content = postman_body.get('raw', '')
        body['content'] = content
        
        # Try to determine content type
        options = postman_body.get('options', {})
        if 'raw' in options and 'language' in options['raw']:
            lang = options['raw']['language']
            if lang == 'json':
                body['type'] = 'json'
    
    return body if body else None


def convert_headers(postman_headers):
    """Convert Postman headers to Posting.sh format"""
    if not postman_headers:
        return []
    
    headers = []
    for header in postman_headers:
        headers.append({
            'name': header.get('key', ''),
            'value': header.get('value', '')
        })
    
    return headers


def convert_query_params(postman_url):
    """Convert Postman query parameters to Posting.sh format"""
    if not isinstance(postman_url, dict):
        return []
    
    query = postman_url.get('query', [])
    if not query:
        return []
    
    params = []
    for param in query:
        params.append({
            'name': param.get('key', ''),
            'value': param.get('value', '')
        })
    
    return params


def build_url(postman_url):
    """Build URL string from Postman URL object"""
    if isinstance(postman_url, str):
        return postman_url
    
    if isinstance(postman_url, dict):
        raw = postman_url.get('raw', '')
        return raw
    
    return ''


def convert_request(request_item, folder_path=''):
    """Convert a Postman request to Posting.sh format"""
    request = request_item.get('request', {})
    
    # Basic request info
    posting_request = {
        'name': request_item.get('name', 'Untitled'),
    }
    
    # Add description if present
    description = request_item.get('description', '')
    if description:
        posting_request['description'] = description
    
    # Method
    method = request.get('method', 'GET')
    posting_request['method'] = method
    
    # URL
    url = request.get('url', '')
    posting_request['url'] = build_url(url)
    
    # Headers
    headers = convert_headers(request.get('header', []))
    if headers:
        posting_request['headers'] = headers
    
    # Query parameters
    if isinstance(request.get('url'), dict):
        params = convert_query_params(request['url'])
        if params:
            posting_request['params'] = params
    
    # Body
    body = convert_body(request.get('body', {}))
    if body:
        posting_request['body'] = body
    
    return posting_request


def process_items(items, base_path, folder_path=''):
    """Recursively process Postman collection items"""
    created_files = []
    
    for item in items:
        # Check if this is a folder or a request
        if 'item' in item:
            # This is a folder
            folder_name = sanitize_filename(item.get('name', 'folder'))
            new_folder_path = os.path.join(folder_path, folder_name)
            new_base_path = os.path.join(base_path, folder_name)
            
            # Create the folder
            os.makedirs(new_base_path, exist_ok=True)
            
            # Process items in the folder
            created_files.extend(
                process_items(item['item'], new_base_path, new_folder_path)
            )
        else:
            # This is a request
            posting_request = convert_request(item, folder_path)
            
            # Generate filename
            filename = sanitize_filename(posting_request['name']) + '.posting.yaml'
            filepath = os.path.join(base_path, filename)
            
            # Write YAML file
            write_yaml_file(filepath, posting_request)
            
            # Store relative path for summary
            rel_path = os.path.join(folder_path, filename) if folder_path else filename
            created_files.append(rel_path)
    
    return created_files


def write_yaml_file(filepath, data):
    """Write data to YAML file with proper formatting"""
    import yaml
    
    with open(filepath, 'w') as f:
        yaml.dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)


def convert_postman_to_posting(postman_file, output_dir):
    """Main conversion function"""
    # Load Postman collection
    with open(postman_file, 'r') as f:
        collection = json.load(f)
    
    # Get collection info
    info = collection.get('info', {})
    collection_name = sanitize_filename(info.get('name', 'collection'))
    
    # Create output directory
    output_path = os.path.join(output_dir, collection_name)
    os.makedirs(output_path, exist_ok=True)
    
    # Process all items
    print(f"Converting Postman collection '{info.get('name', 'Unknown')}'...")
    created_files = process_items(collection.get('item', []), output_path)
    
    print(f"\n✓ Conversion complete!")
    print(f"✓ Created {len(created_files)} request files")
    print(f"✓ Output directory: {output_path}")
    print(f"\nTo use with Posting.sh:")
    print(f"  posting --collection {output_path}")
    
    return output_path


if __name__ == '__main__':
    import sys
    
    # Check for PyYAML
    try:
        import yaml
    except ImportError:
        print("Error: PyYAML is required. Install it with: pip install pyyaml --break-system-packages")
        sys.exit(1)
    
    if len(sys.argv) < 2:
        print("Usage: python convert_to_posting.py <postman_collection.json> [output_dir]")
        sys.exit(1)
    
    postman_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else '/mnt/user-data/outputs'
    
    if not os.path.exists(postman_file):
        print(f"Error: File '{postman_file}' not found")
        sys.exit(1)
    
    convert_postman_to_posting(postman_file, output_dir)
