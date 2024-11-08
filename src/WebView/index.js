(function() {
    // Get VS Code webview API
    const vscode = acquireVsCodeApi();

    // Your existing code with some modifications
    const headersContainer = document.getElementById('headers-container');
    const addHeaderButton = document.getElementById('add-header');

    function createHeaderInput() {
        const headerInput = document.createElement('div');
        headerInput.className = 'header-input';
        headerInput.innerHTML = `
            <input type="text" placeholder="Header name" aria-label="Header name">
            <input type="text" placeholder="Header value" aria-label="Header value">
            <button type="button" class="remove-header" aria-label="Remove header">Remove</button>
        `;
        headerInput.querySelector('.remove-header').addEventListener('click', function() {
            headerInput.remove();
        });
        return headerInput;
    }

    addHeaderButton.addEventListener('click', function() {
        headersContainer.insertBefore(createHeaderInput(), addHeaderButton);
    });

    document.getElementById('apiForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const url = document.getElementById('url').value;
        const method = document.getElementById('method').value;
        const bodyText = document.getElementById('body').value;

        const headers = {};
        document.querySelectorAll('.header-input').forEach(headerInput => {
            const [nameInput, valueInput] = headerInput.querySelectorAll('input');
            if (nameInput.value && valueInput.value) {
                headers[nameInput.value] = valueInput.value;
            }
        });

        const responseDiv = document.getElementById('response');
        responseDiv.textContent = 'Sending request...';
        let body;
        try {
            body = bodyText ? JSON.parse(bodyText) : undefined;
        } catch (error) {
            responseDiv.textContent = 'Invalid JSON format in the request body';
            return;
        }
        try {
            // Instead of using fetch directly, send a message to the extension
            vscode.postMessage({
                command: 'makeRequest',
                payload: {
                    url,
                    method,
                    headers,
                    body: method !== 'GET' ? body : undefined
                }
            });
        } catch (error) {
            responseDiv.textContent = `Error: ${error.message}`;
        }
    });

    window.addEventListener('message', event => {
        const message = event.data;
        const responseDiv = document.getElementById('response');
    
        switch (message.command) {
            case 'requestResponse':
                const { status, statusText, body, headers, set_cookies, time } = message.payload;
    
                // Clear previous content
                responseDiv.innerHTML = '';
    
                // Create and style sections
                const statusSection = `<div class="response-section"><strong>Status:</strong> ${status} ${statusText}</div>`;
                const timeSection = `<div class="response-section"><strong>Time:</strong> ${time} ms</div>`;
                const headersSection = `<div class="response-section"><strong>Headers:</strong><pre>${JSON.stringify(headers, null, 2)}</pre></div>`;
                const cookiesSection = `<div class="response-section"><strong>Set-Cookies:</strong><pre>${JSON.stringify(set_cookies, null, 2)}</pre></div>`;
                const bodySection = `<div class="response-section"><strong>Response Body:</strong><pre>${JSON.stringify(body, null, 2)}</pre></div>`;
    
                // Append sections to the response div
                responseDiv.innerHTML = statusSection + timeSection + headersSection + cookiesSection + bodySection;
                break;
    
            case 'requestError':
                responseDiv.textContent = `Error: ${message.payload.error}`;
                break;
        }
    });
    
})();