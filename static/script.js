document.getElementById('simulator-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const referenceString = document.getElementById('reference-string').value;
    const frameCount = document.getElementById('frame-count').value;
    const algorithm = document.getElementById('algorithm').value;

    const data = {
        reference_string: referenceString,
        frame_count: frameCount,
        algorithm: algorithm
    };

    fetch('/simulate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('result').innerText = data.error 
            ? data.error 
            : `Page Faults: ${data.page_faults}`;
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('result').innerText = 'An error occurred. Please try again.';
    });
});
