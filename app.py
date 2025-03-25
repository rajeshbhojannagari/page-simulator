from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

def fifo(reference_string, frame_count):
    frames = []
    page_faults = 0
    for page in reference_string:
        if page not in frames:
            if len(frames) < frame_count:
                frames.append(page)
            else:
                frames.pop(0)
                frames.append(page)
            page_faults += 1
    return page_faults

def lru(reference_string, frame_count):
    frames = []
    page_faults = 0
    for page in reference_string:
        if page not in frames:
            if len(frames) < frame_count:
                frames.append(page)
            else:
                frames.pop(frames.index(min(frames, key=lambda x: reference_string.index(x, reference_string.index(page) + 1) if x in reference_string[reference_string.index(page) + 1:] else float('inf'))))
                frames.append(page)
            page_faults += 1
    return page_faults

def optimal(reference_string, frame_count):
    frames = []
    page_faults = 0
    for i, page in enumerate(reference_string):
        if page not in frames:
            if len(frames) < frame_count:
                frames.append(page)
            else:
                farthest = -1
                page_to_replace = None
                for f in frames:
                    try:
                        index = reference_string.index(f, i)
                    except ValueError:
                        index = float('inf')
                    if index > farthest:
                        farthest = index
                        page_to_replace = f
                frames.remove(page_to_replace)
                frames.append(page)
            page_faults += 1
    return page_faults

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.json
    reference_string = list(map(int, data['reference_string'].split(',')))
    frame_count = int(data['frame_count'])
    algorithm = data['algorithm']

    if algorithm == 'FIFO':
        page_faults = fifo(reference_string, frame_count)
    elif algorithm == 'LRU':
        page_faults = lru(reference_string, frame_count)
    elif algorithm == 'Optimal':
        page_faults = optimal(reference_string, frame_count)
    else:
        return jsonify({'error': 'Invalid algorithm'}), 400

    return jsonify({'page_faults': page_faults})

if __name__ == '__main__':
    app.run(debug=True)
