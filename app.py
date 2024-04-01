from flask import Flask, request, jsonify
import waybackpy
from flask_cors import CORS
import time
from urllib.parse import unquote  # Import the unquote function to decode URL-encoded data



app = Flask(__name__)
CORS(app)

@app.route('/archive-website', methods=['POST'])
def archive_website():
    try:
        data = request.get_json()
        url = data.get('url')
        print(url)

        if not url:
            raise ValueError("URL is missing in the request body")

        # Create a WaybackPy Url object and save the archive
        new_archive_url = waybackpy.Url(
                user_agent = "Mozilla/5.0 (Windows NT 5.1; rv:40.0) Gecko/20100101 Firefox/40.0", 
                url = url
            ).save()

        print(new_archive_url)

        return jsonify({'success': True, 'archive_url': str(new_archive_url)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
    
@app.route('/scrape-page', methods=['POST'])
def scrape_page():
    current_time = time.time()
    try:
        data = request.get_json()
        content = data.get('content')

        

        if not content:
            raise ValueError("Content is missing in the request body")
        else :
            decoded_content = unquote(content)
            with open(f'{current_time}_index.html', 'w', encoding='utf-8') as f:
                f.write(decoded_content)

        # Return a response
        return jsonify({'success': True, 'message': 'Page scraped successfully and processed.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(port=3000, debug=True)
