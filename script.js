// Wait for MathJax to be ready
window.addEventListener('load', () => {
    // Add initial equation editor
    addEquationEditor();
    
    // Add event listener for the "Add New Equation" button
    document.getElementById('add-equation').addEventListener('click', addEquationEditor);
    
    // Add keyboard shortcut listener for Command+Enter or Ctrl+Enter
    document.addEventListener('keydown', handleKeyboardShortcut);
});

// Handle keyboard shortcuts
function handleKeyboardShortcut(event) {
    // Check for Command+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault(); // Prevent default behavior
        
        // Get the currently focused element
        const activeElement = document.activeElement;
        
        // If the active element is a textarea, add a new editor after it
        if (activeElement && activeElement.classList.contains('latex-input')) {
            const currentEditor = activeElement.closest('.equation-editor');
            const currentEditorId = currentEditor.id;
            
            // Add new editor after the current one
            addEquationEditorAfter(currentEditorId);
        } else {
            // If no textarea is focused, just add a new editor at the end
            addEquationEditor();
        }
    }
}

// Create a new equation editor after a specific one
function addEquationEditorAfter(editorId) {
    const container = document.getElementById('equations-container');
    const currentEditor = document.getElementById(editorId);
    
    // Create a new editor
    const newEditorId = 'equation-' + Date.now();
    
    const editorHTML = `
        <div class="equation-editor" id="${newEditorId}">
            <div class="equation-header">
                <span class="equation-title">Equation Editor</span>
                <div class="equation-controls">
                    <button class="btn expand-btn" onclick="expandEquation('${newEditorId}')">Expand</button>
                    <button class="btn factor-btn" onclick="factorEquation('${newEditorId}')">Factor</button>
                    <button class="btn copy-btn" onclick="copyEquation('${newEditorId}')">Copy LaTeX</button>
                    <button class="btn delete-btn" onclick="deleteEquation('${newEditorId}')">Delete</button>
                </div>
            </div>
            <div class="equation-content">
                <div class="equation-input">
                    <textarea class="latex-input" rows="5" placeholder="Enter your LaTeX equation here..."></textarea>
                </div>
                <div class="equation-output">
                    <div class="output mathjax-output"></div>
                </div>
                <div class="equation-transformed">
                    <div class="transformed-label">Transformed:</div>
                    <div class="transformed-latex"></div>
                </div>
                <div class="equation-transformed-output">
                    <div class="output mathjax-transformed-output"></div>
                </div>
            </div>
        </div>
    `;
    
    // Insert the new editor after the current one
    currentEditor.insertAdjacentHTML('afterend', editorHTML);
    
    // Add input event listener to the new textarea
    const textarea = document.querySelector(`#${newEditorId} .latex-input`);
    textarea.addEventListener('input', debounce(() => updateEquation(newEditorId), CONFIG.UI.DEBOUNCE_TIME));
    
    // Focus the new textarea
    textarea.focus();
    
    // Initial render
    updateEquation(newEditorId);
}

// Create a new equation editor
function addEquationEditor(initialContent = '') {
    const container = document.getElementById('equations-container');
    const editorId = 'equation-' + Date.now();
    
    const editorHTML = `
        <div class="equation-editor" id="${editorId}">
            <div class="equation-header">
                <span class="equation-title">Equation Editor</span>
                <div class="equation-controls">
                    <button class="btn expand-btn" onclick="expandEquation('${editorId}')">Expand</button>
                    <button class="btn factor-btn" onclick="factorEquation('${editorId}')">Factor</button>
                    <button class="btn copy-btn" onclick="copyEquation('${editorId}')">Copy LaTeX</button>
                    <button class="btn delete-btn" onclick="deleteEquation('${editorId}')">Delete</button>
                </div>
            </div>
            <div class="equation-content">
                <div class="equation-input">
                    <textarea class="latex-input" rows="5" placeholder="Enter your LaTeX equation here...">${initialContent}</textarea>
                </div>
                <div class="equation-output">
                    <div class="output mathjax-output"></div>
                </div>
                <div class="equation-transformed">
                    <div class="transformed-label">Transformed:</div>
                    <div class="transformed-latex"></div>
                </div>
                <div class="equation-transformed-output">
                    <div class="output mathjax-transformed-output"></div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', editorHTML);
    
    // Add input event listener to the new textarea
    const textarea = document.querySelector(`#${editorId} .latex-input`);
    textarea.addEventListener('input', debounce(() => updateEquation(editorId), CONFIG.UI.DEBOUNCE_TIME));
    
    // Focus the new textarea
    textarea.focus();
    
    // Initial render
    updateEquation(editorId);
}

// Update a specific equation
function updateEquation(editorId) {
    const editor = document.getElementById(editorId);
    const latexInput = editor.querySelector('.latex-input').value;
    const output = editor.querySelector('.mathjax-output');
    
    output.innerHTML = `\\[${latexInput}\\]`;
    MathJax.typesetPromise([output]).catch((err) => {
        console.error('MathJax error:', err);
        output.innerHTML = '<span style="color: red;">Error rendering equation</span>';
    });
}

// Expand an equation using the API
function expandEquation(editorId) {
    const editor = document.getElementById(editorId);
    const latexInput = editor.querySelector('.latex-input').value;
    const transformedLatex = editor.querySelector('.transformed-latex');
    const transformedOutput = editor.querySelector('.mathjax-transformed-output');
    
    // Show loading state
    transformedLatex.textContent = 'Loading...';
    transformedOutput.innerHTML = '<span style="color: #3498db;">Processing...</span>';
    
    console.log('Sending expand request with:', latexInput);
    
    // Send request to the expand endpoint
    fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.EXPAND}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expression: latexInput }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Expand response:', data);
        // Update the transformed LaTeX and render it
        transformedLatex.textContent = data.result;
        transformedOutput.innerHTML = `\\[${data.result}\\]`;
        MathJax.typesetPromise([transformedOutput]).catch((err) => {
            console.error('MathJax error:', err);
            transformedOutput.innerHTML = '<span style="color: red;">Error rendering equation</span>';
        });
    })
    .catch(error => {
        console.error('Expand error:', error);
        transformedLatex.textContent = 'Error: ' + error.message;
        transformedOutput.innerHTML = '<span style="color: red;">Error processing equation. Is the server running?</span>';
    });
}

// Factor an equation using the API
function factorEquation(editorId) {
    const editor = document.getElementById(editorId);
    const latexInput = editor.querySelector('.latex-input').value;
    const transformedLatex = editor.querySelector('.transformed-latex');
    const transformedOutput = editor.querySelector('.mathjax-transformed-output');
    
    // Show loading state
    transformedLatex.textContent = 'Loading...';
    transformedOutput.innerHTML = '<span style="color: #3498db;">Processing...</span>';
    
    console.log('Sending factor request with:', latexInput);
    
    // Send request to the factor endpoint
    fetch(`${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.FACTOR}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expression: latexInput }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Factor response:', data);
        // Update the transformed LaTeX and render it
        transformedLatex.textContent = data.result;
        transformedOutput.innerHTML = `\\[${data.result}\\]`;
        MathJax.typesetPromise([transformedOutput]).catch((err) => {
            console.error('MathJax error:', err);
            transformedOutput.innerHTML = '<span style="color: red;">Error rendering equation</span>';
        });
    })
    .catch(error => {
        console.error('Factor error:', error);
        transformedLatex.textContent = 'Error: ' + error.message;
        transformedOutput.innerHTML = '<span style="color: red;">Error processing equation. Is the server running?</span>';
    });
}

// Copy LaTeX content to clipboard
function copyEquation(editorId) {
    const editor = document.getElementById(editorId);
    const latexInput = editor.querySelector('.latex-input').value;
    
    navigator.clipboard.writeText(latexInput).then(() => {
        // Show a temporary success message
        const copyBtn = editor.querySelector('.copy-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, CONFIG.UI.COPY_FEEDBACK_DURATION);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Delete an equation editor
function deleteEquation(editorId) {
    const editor = document.getElementById(editorId);
    editor.remove();
}

// Debounce function to limit the rate of updates
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 