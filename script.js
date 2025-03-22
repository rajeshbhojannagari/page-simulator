class PageReplacementVisualizer {
    constructor() {
        this.referenceString = [];
        this.frames = 0;
        this.algorithm = '';
        this.currentStep = 0;
        this.simulationSteps = [];
        this.charts = {};
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('simulate').addEventListener('click', () => this.startSimulation());
        document.getElementById('prevStep').addEventListener('click', () => this.showPreviousStep());
        document.getElementById('nextStep').addEventListener('click', () => this.showNextStep());
    }

    startSimulation() {
        // Get input values
        const refString = document.getElementById('referenceString').value;
        this.referenceString = refString.split(' ').map(Number);
        this.frames = parseInt(document.getElementById('frames').value);
        this.algorithm = document.getElementById('algorithm').value;

        // Validate input
        if (!this.validateInput()) {
            alert('Please enter valid input values');
            return;
        }

        // Run simulation
        this.runSimulation();
        
        // Show results
        document.getElementById('results').classList.remove('hidden');
        
        // Initialize visualization
        this.currentStep = 0;
        this.updateVisualization();
        this.createCharts();
    }

    validateInput() {
        return this.referenceString.every(n => !isNaN(n)) && 
               this.frames > 0 && 
               this.referenceString.length > 0;
    }

    runSimulation() {
        // Implementation of page replacement algorithms
        switch(this.algorithm) {
            case 'fifo':
                this.simulateFIFO();
                break;
            case 'lru':
                this.simulateLRU();
                break;
            case 'optimal':
                this.simulateOptimal();
                break;
        }
    }

    simulateFIFO() {
        let frames = new Array(this.frames).fill(-1);
        let pointer = 0;  // Points to the next frame to be replaced
        this.simulationSteps = [];

        for (let i = 0; i < this.referenceString.length; i++) {
            const page = this.referenceString[i];
            let pageFault = true;

            // Check if page already exists
            if (frames.includes(page)) {
                pageFault = false;
            } else {
                // If page not found, replace the oldest page (FIFO)
                frames[pointer] = page;
                pointer = (pointer + 1) % this.frames;
            }

            // Save step for visualization
            this.simulationSteps.push({
                frames: [...frames],
                pageFault,
                currentPage: page,
                replacedIndex: pageFault ? (pointer === 0 ? this.frames - 1 : pointer - 1) : -1
            });
        }

        this.updateStats();
    }

    simulateLRU() {
        let frames = new Array(this.frames).fill(-1);
        let lastUsed = new Array(this.frames).fill(-1);  // Tracks when each frame was last used
        this.simulationSteps = [];

        for (let i = 0; i < this.referenceString.length; i++) {
            const page = this.referenceString[i];
            let pageFault = true;
            let replacedIndex = -1;

            // Check if page already exists
            const existingIndex = frames.indexOf(page);
            if (existingIndex !== -1) {
                pageFault = false;
                lastUsed[existingIndex] = i;  // Update last used time
            } else {
                // Find the least recently used page
                let lruIndex = 0;
                let minLastUsed = Infinity;

                // First check for empty frames
                const emptyIndex = frames.indexOf(-1);
                if (emptyIndex !== -1) {
                    lruIndex = emptyIndex;
                } else {
                    // Find the page that was used least recently
                    for (let j = 0; j < frames.length; j++) {
                        if (lastUsed[j] < minLastUsed) {
                            minLastUsed = lastUsed[j];
                            lruIndex = j;
                        }
                    }
                }

                // Replace the LRU page
                replacedIndex = lruIndex;
                frames[lruIndex] = page;
                lastUsed[lruIndex] = i;
            }

            // Save step for visualization
            this.simulationSteps.push({
                frames: [...frames],
                pageFault,
                currentPage: page,
                lastUsed: [...lastUsed],
                replacedIndex
            });
        }

        this.updateStats();
    }

    simulateOptimal() {
        let frames = new Array(this.frames).fill(-1);
        this.simulationSteps = [];

        for (let i = 0; i < this.referenceString.length; i++) {
            const page = this.referenceString[i];
            let pageFault = true;
            let replacedIndex = -1;

            // Check if page already exists
            if (frames.includes(page)) {
                pageFault = false;
            } else {
                // Find the optimal page to replace
                let replaceIndex = 0;
                
                // First check for empty frames
                const emptyIndex = frames.indexOf(-1);
                if (emptyIndex !== -1) {
                    replaceIndex = emptyIndex;
                } else {
                    // Find the page that won't be used for the longest time
                    let farthestUse = -1;
                    
                    for (let j = 0; j < frames.length; j++) {
                        // Find the next use of current frame's page
                        let nextUse = -1;
                        for (let k = i + 1; k < this.referenceString.length; k++) {
                            if (this.referenceString[k] === frames[j]) {
                                nextUse = k;
                                break;
                            }
                        }

                        // If page will never be used again, select it for replacement
                        if (nextUse === -1) {
                            replaceIndex = j;
                            break;
                        }

                        // If this page's next use is farther than current farthest, update
                        if (nextUse > farthestUse) {
                            farthestUse = nextUse;
                            replaceIndex = j;
                        }
                    }
                }

                replacedIndex = replaceIndex;
                frames[replaceIndex] = page;
            }

            // Save step for visualization with future reference information
            this.simulationSteps.push({
                frames: [...frames],
                pageFault,
                currentPage: page,
                replacedIndex,
                futureUses: this.getFutureUses(i)
            });
        }

        this.updateStats();
    }

    getFutureUses(currentIndex) {
        // Helper function to get future uses of pages for Optimal algorithm visualization
        let futureUses = {};
        for (let i = currentIndex + 1; i < this.referenceString.length; i++) {
            const page = this.referenceString[i];
            if (!(page in futureUses)) {
                futureUses[page] = i - currentIndex;
            }
        }
        return futureUses;
    }

    updateVisualization() {
        const step = this.simulationSteps[this.currentStep];
        const memoryState = document.getElementById('memoryState');
        memoryState.innerHTML = '';

        // Add step counter
        const stepCounter = document.createElement('div');
        stepCounter.className = 'step-counter';
        stepCounter.textContent = `Step ${this.currentStep + 1} of ${this.simulationSteps.length}`;
        memoryState.appendChild(stepCounter);

        // Create reference string visualization
        const refString = document.createElement('div');
        refString.className = 'reference-string';
        refString.innerHTML = `
            <div class="ref-title">Reference String:</div>
            <div class="ref-values">
                ${this.referenceString.map((val, idx) => `
                    <span class="${idx === this.currentStep ? 'current' : ''}">${val}</span>
                `).join('')}
            </div>
        `;
        memoryState.appendChild(refString);

        // Create frame visualization
        const frameRow = document.createElement('div');
        frameRow.className = 'frame-row';
        
        step.frames.forEach((frame, index) => {
            const frameElement = document.createElement('div');
            frameElement.className = 'frame';
            
            if (frame === step.currentPage) {
                frameElement.classList.add('highlight');
            }
            if (step.pageFault && index === step.replacedIndex) {
                frameElement.classList.add('fault');
            }
            
            let additionalInfo = '';
            if (this.algorithm === 'lru' && step.lastUsed) {
                additionalInfo = `<span class="frame-info">Last used: ${step.lastUsed[index] === -1 ? 'never' : step.lastUsed[index]}</span>`;
            } else if (this.algorithm === 'optimal' && step.futureUses && frame !== -1) {
                const nextUse = step.futureUses[frame] || '∞';
                additionalInfo = `<span class="frame-info">Next use in: ${nextUse}</span>`;
            }
            
            frameElement.innerHTML = `
                <span class="frame-number">Frame ${index + 1}</span>
                <span class="frame-value">${frame === -1 ? 'Empty' : frame}</span>
                ${additionalInfo}
            `;
            
            frameRow.appendChild(frameElement);
        });

        memoryState.appendChild(frameRow);

        // Update status message
        const status = document.createElement('div');
        status.className = 'status-message';
        status.textContent = step.pageFault ? 
            `Page Fault: Page ${step.currentPage} needs to be loaded into memory` :
            `Page Hit: Page ${step.currentPage} found in memory`;
        memoryState.appendChild(status);
    }

    createCharts() {
        // Access Pattern Chart
        const accessCtx = document.getElementById('accessPatternChart').getContext('2d');
        this.charts.accessPattern = new Chart(accessCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: this.referenceString.length}, (_, i) => i + 1),
                datasets: [{
                    label: 'Page Access Pattern',
                    data: this.referenceString,
                    borderColor: '#1a73e8',
                    tension: 0.1
                }]
            }
        });

        // Performance Chart
        const perfCtx = document.getElementById('performanceChart').getContext('2d');
        this.charts.performance = new Chart(perfCtx, {
            type: 'bar',
            data: {
                labels: ['Page Faults', 'Page Hits'],
                datasets: [{
                    label: 'Performance Metrics',
                    data: this.getPerformanceMetrics(),
                    backgroundColor: ['#dc3545', '#28a745']
                }]
            }
        });
    }

    getPerformanceMetrics() {
        const faults = this.simulationSteps.filter(step => step.pageFault).length;
        return [faults, this.simulationSteps.length - faults];
    }

    updateStats() {
        const faults = this.simulationSteps.filter(step => step.pageFault).length;
        const hitRatio = ((this.simulationSteps.length - faults) / this.simulationSteps.length * 100).toFixed(2);
        
        document.getElementById('pageFaults').textContent = faults;
        document.getElementById('hitRatio').textContent = `${hitRatio}%`;
    }

    showPreviousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateVisualization();
        }
    }

    showNextStep() {
        if (this.currentStep < this.simulationSteps.length - 1) {
            this.currentStep++;
            this.updateVisualization();
        }
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PageReplacementVisualizer();
}); 

