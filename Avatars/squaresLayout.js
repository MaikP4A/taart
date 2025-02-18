const colors = [
    '#FF6384', '#36A2EB', '#4CAF50', '#FFA726', // Original colors
    '#9C27B0', '#607D8B', '#E91E63', '#3F51B5', // Purple, Blue Grey, Pink, Indigo
    '#009688', '#795548', '#FFEB3B', '#FF5722', // Teal, Brown, Yellow, Deep Orange
    '#8BC34A' // Light Green
];

    // Count avatars per lunch
    let lunchCounts = {};

// Add at the top of the file with other global variables
let squaresVisible = false;
let activeTimeouts = []; // Track active timeouts

function getApiBaseUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('apiUrl');  // Default if not specified
}

async function showSquaresLayout() {
    const chart = document.getElementById('chartContainer');
    
    // If squares are already visible, hide them and reset
    if (squaresVisible) {
        squaresVisible = false;
        chart.style.transition = 'transform 0.5s cubic-bezier(0, 1, 0, 1)';
        chart.style.transform = 'translate(-50%, -50%) scale(0)';

        // Clear all active timeouts
        activeTimeouts.forEach(timeout => clearTimeout(timeout));
        activeTimeouts = [];

        // Reset wander area and speeds for all avatars
        avatars.forEach(avatar => {
            // Clear any running intervals
            if (avatar.wanderInterval) clearInterval(avatar.wanderInterval);
            if (avatar.checkInterval) clearInterval(avatar.checkInterval);
            
            // Reset wandering state
            avatar.wandering = true;
            avatar.wanderToTarget = false;
            
            // Reset wander area to full screen
            avatar.wanderArea = {
                x: 0,
                y: 0,
                width: window.innerWidth - AVATAR_SIZE,
                height: window.innerHeight - AVATAR_SIZE
            };
            
            // Reset to normal wandering speed
            avatar.speedX = randomDirection();
            avatar.speedY = randomDirection();

            // Reset eyes
            resetAvatarEyes(avatar);
        });
        return;
    }

    try {
        // Set flag to indicate squares are now visible
        squaresVisible = true;

        // Fetch lunch choices from emails
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/avatar/mails`);
        if (!response.ok) {
            throw new Error('Failed to fetch lunch data');
        }
        const lunchData = await response.json();

        // Parse lunch data from email format
        const lunchChoiceMap = new Map();
        lunchData.forEach(emailData => {
            const [email, lunchChoice] = emailData.split(',');
            // Extract last name from email (assuming format firstname.lastname@domain)
            const emailParts = email.split('@')[0];
            lunchChoiceMap.set(emailParts, lunchChoice.trim());
        });

        // Match avatars with their lunch choices
        avatars.forEach(avatar => {
            const lastName = avatar.name.split(' ').pop().toLowerCase();
            const lunch = Array.from(lunchChoiceMap.entries()).find(([email, lunchChoice]) => email.includes(lastName))?.[1] || 'Niet besteld!';
            avatar.selectedLunch = lunch;
        });

        // Update lunch counts based on actual selections
        lunchCounts = {};
        avatars.forEach(avatar => {
            lunchCounts[avatar.selectedLunch] = (lunchCounts[avatar.selectedLunch] || 0) + 1;
        });

        // Continue with existing layout code...
        const svgElement = document.getElementById('voteChart');
        
        svgElement.innerHTML = '';
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        svgElement.setAttribute('viewBox', `0 0 ${viewportWidth} ${viewportHeight}`);
        
        chart.style.opacity = '1';
        chart.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        chart.style.transform = 'translate(-50%, -50%) scale(1)';

        const selectedLunches = Object.keys(lunchCounts);
        const totalLunches = selectedLunches.length;
        let maxSquaresPerRow = Math.min(totalLunches, 5);
        const numRows = Math.ceil(totalLunches / maxSquaresPerRow);
        
        const baseSquareWidth = viewportWidth / (maxSquaresPerRow + 0.5);
        const baseSquareHeight = viewportHeight / (numRows + 0.5);
        const gap = Math.min(baseSquareWidth, baseSquareHeight) * 0.05;
        
        let currentX = 0;
        let currentY = 0;
        const lunchPositions = {};

        selectedLunches.forEach((lunch, index) => {
            const squareWidth = baseSquareWidth + gap;
            const squareHeight = baseSquareHeight + gap;
            
            if (currentX + squareWidth > viewportWidth) {
                currentX = 0;
                currentY += squareHeight + gap;
            }
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', currentX);
            rect.setAttribute('y', currentY);
            rect.setAttribute('width', squareWidth);
            rect.setAttribute('height', squareHeight);
            rect.setAttribute('fill', colors[index % colors.length]);
            rect.setAttribute('rx', '5');
            rect.setAttribute('class', `lunch-area lunch-${index}`);
            rect.setAttribute('stroke', 'white');
            rect.setAttribute('stroke-width', 20);
            svgElement.appendChild(rect);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', currentX + squareWidth / 2);
            text.setAttribute('y', currentY + squareHeight / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '50px');
            text.textContent = lunch;
            svgElement.appendChild(text);

            lunchPositions[lunch] = { x: currentX, y: currentY, width: squareWidth, height: squareHeight };

            currentX += squareWidth + gap;
        });

        // Store timeout IDs when creating timeouts
        activeTimeouts.push(setTimeout(() => {
            moveAvatarsToSquares(lunchPositions);
        }, 500));

        activeTimeouts.push(setTimeout(() => {
            chart.style.transform = 'translate(-50%, -50%) scale(1.1)';
            activeTimeouts.push(setTimeout(() => {
                if (squaresVisible) {
                    squaresVisible = false;
                    chart.style.transition = 'transform 0.5s cubic-bezier(0, 1, 0, 1)';
                    chart.style.transform = 'translate(-50%, -50%) scale(0)';

                    // Reset wander area and speeds for all avatars
                    avatars.forEach(avatar => {
                        // Clear any running intervals
                        if (avatar.wanderInterval) clearInterval(avatar.wanderInterval);
                        if (avatar.checkInterval) clearInterval(avatar.checkInterval);
                        
                        // Reset wandering state
                        avatar.wandering = true;
                        avatar.wanderToTarget = false;
                        
                        // Reset wander area to full screen
                        avatar.wanderArea = { 
                            x: 0, 
                            y: 0, 
                            width: viewportWidth, 
                            height: viewportHeight 
                        };
                        
                        // Reset to normal wandering speed
                        avatar.speedX = randomDirection();
                        avatar.speedY = randomDirection();

                        // Reset eyes
                        resetAvatarEyes(avatar);
                    });
                }
            }, 300));
        }, 20000));
    } catch (error) {
        console.error('Error organizing avatars by lunch:', error);
        squaresVisible = false;
        // Clear timeouts in case of error
        activeTimeouts.forEach(timeout => clearTimeout(timeout));
        activeTimeouts = [];
    }
}

function moveAvatarsToSquares(lunchPositions) {
    avatars.forEach(avatar => {
        // Make all avatars surprised while running
        const head = avatar.element.querySelector('.head');
        const currentUrl = new URL(head.src);
        const params = new URLSearchParams(currentUrl.search);
        const originalEyeType = params.get('eyeType');
        params.set('eyeType', 'Surprised');
        head.src = `https://avataaars.io/?${params.toString()}`;

        const lunchPosition = lunchPositions[avatar.selectedLunch];
        
        // Account for stroke width when calculating target area
        const strokeWidth = 20;
        const adjustedLunchPosition = {
            x: lunchPosition.x + strokeWidth,
            y: lunchPosition.y + strokeWidth,
            width: lunchPosition.width - (strokeWidth * 2),
            height: lunchPosition.height - (strokeWidth * 2)
        };
        
        const targetX = adjustedLunchPosition.x + Math.random() * (adjustedLunchPosition.width - AVATAR_SIZE);
        const targetY = adjustedLunchPosition.y + Math.random() * (adjustedLunchPosition.height - AVATAR_SIZE);

        avatar.wandering = true;
        avatar.targetX = targetX;
        avatar.targetY = targetY;
        avatar.wanderToTarget = true;
        
        const angleToTarget = Math.atan2(targetY - avatar.y, targetX - avatar.x);
        const randomAngleOffset = (Math.random() - 0.5) * Math.PI / 2;
        const runningSpeed = 6.5; // Speed while running to lunch box (2.5x)
        
        avatar.speedX = Math.cos(angleToTarget + randomAngleOffset) * runningSpeed;
        avatar.speedY = Math.sin(angleToTarget + randomAngleOffset) * runningSpeed;
        
        avatar.wanderInterval = setInterval(() => {
            if (!avatar.wanderToTarget) {
                clearInterval(avatar.wanderInterval);
                return;
            }

            const newAngle = Math.atan2(targetY - avatar.y, targetX - avatar.x);
            const newRandomOffset = (Math.random() - 0.5) * Math.PI / 2;
            
            avatar.speedX = Math.cos(newAngle + newRandomOffset) * runningSpeed;
            avatar.speedY = Math.sin(newAngle + newRandomOffset) * runningSpeed;
        }, 1000);

        avatar.checkInterval = setInterval(() => {
            // Check if avatar is inside the lunch box bounds
            const isInBox = 
                avatar.x >= adjustedLunchPosition.x && 
                avatar.x <= adjustedLunchPosition.x + adjustedLunchPosition.width - AVATAR_SIZE &&
                avatar.y >= adjustedLunchPosition.y && 
                avatar.y <= adjustedLunchPosition.y + adjustedLunchPosition.height - AVATAR_SIZE;

            if (isInBox) {
                clearInterval(avatar.wanderInterval);
                clearInterval(avatar.checkInterval);
                avatar.wanderToTarget = false;
                
                // Reset eyes back to original state when reaching destination
                params.set('eyeType', originalEyeType);
                head.src = `https://avataaars.io/?${params.toString()}`;
                
                avatar.wanderArea = {
                    x: adjustedLunchPosition.x,
                    y: adjustedLunchPosition.y,
                    width: adjustedLunchPosition.width - AVATAR_SIZE,
                    height: adjustedLunchPosition.height - AVATAR_SIZE
                };
                
                // Slow down to 0.5x speed when in lunch box
                const lunchBoxSpeed = 1.5;
                avatar.speedX = (Math.random() - 0.5) * lunchBoxSpeed;
                avatar.speedY = (Math.random() - 0.5) * lunchBoxSpeed;
            }
        }, 100);
    });
}

// Modify the randomDirection function to return normal speed (1x) for general wandering
function randomDirection() {
    const normalSpeed = 3; // Base speed (1x)
    return (Math.random() - 0.5) * normalSpeed;
}

// Helper function to reset avatar eyes
function resetAvatarEyes(avatar) {
    const head = avatar.element.querySelector('.head');
    const currentUrl = new URL(head.src);
    const params = new URLSearchParams(currentUrl.search);
    const originalEyeType = params.get('eyeType');
    if (originalEyeType === 'Surprised') {
        params.set('eyeType', 'Default');
        head.src = `https://avataaars.io/?${params.toString()}`;
    }
} 