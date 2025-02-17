const colors = [
    '#FF6384', '#36A2EB', '#4CAF50', '#FFA726', // Original colors
    '#9C27B0', '#607D8B', '#E91E63', '#3F51B5', // Purple, Blue Grey, Pink, Indigo
    '#009688', '#795548', '#FFEB3B', '#FF5722', // Teal, Brown, Yellow, Deep Orange
    '#8BC34A' // Light Green
];

    // Count avatars per lunch
    let lunchCounts = {};

function getApiBaseUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('apiUrl') || 'https://localhost:7216';  // Default if not specified
}

async function showSquaresLayout() {
    console.log("IS THIS LOGGED?!");
    try {
        console.log("Do the actual good one?");
        // Fetch lunch choices from emails
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/Gmail/mails`);
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
        const chart = document.getElementById('chartContainer');
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

        setTimeout(() => {
            moveAvatarsToSquares(lunchPositions);
        }, 500);

        setTimeout(() => {
            chart.style.transform = 'translate(-50%, -50%) scale(1.1)';
            setTimeout(() => {
                chart.style.transition = 'transform 0.5s cubic-bezier(0, 1, 0, 1)';
                chart.style.transform = 'translate(-50%, -50%) scale(0)';

                // Reset wander area to full screen
                avatars.forEach(avatar => {
                    avatar.wanderArea = { x: 0, y: 0, width: viewportWidth, height: viewportHeight };
                });
            }, 300);
        }, 35000);
    } catch (error) {
        console.error('Error organizing avatars by lunch:', error);
    }
}

function moveAvatarsToSquares(lunchPositions) {
    avatars.forEach(avatar => {
        const lunchPosition = lunchPositions[avatar.selectedLunch];
        
        // Account for stroke width when calculating target area
        const strokeWidth = 20;
        const adjustedLunchPosition = {
            x: lunchPosition.x + strokeWidth,
            y: lunchPosition.y + strokeWidth,
            width: lunchPosition.width - (strokeWidth * 2),
            height: lunchPosition.height - (strokeWidth * 2)
        };
        
        // Calculate target position within the adjusted lunch area
        const targetX = adjustedLunchPosition.x + Math.random() * (adjustedLunchPosition.width - AVATAR_SIZE);
        const targetY = adjustedLunchPosition.y + Math.random() * (adjustedLunchPosition.height - AVATAR_SIZE);

        // Set wandering properties
        avatar.wandering = true;
        avatar.targetX = targetX;
        avatar.targetY = targetY;
        
        // Update the animation loop to handle wandering towards target
        avatar.wanderToTarget = true;
        
        // Set initial random direction towards target
        const angleToTarget = Math.atan2(targetY - avatar.y, targetX - avatar.x);
        const randomAngleOffset = (Math.random() - 0.5) * Math.PI / 2; // Random angle ±45 degrees
        const speed = 3;
        
        avatar.speedX = Math.cos(angleToTarget + randomAngleOffset) * speed;
        avatar.speedY = Math.sin(angleToTarget + randomAngleOffset) * speed;
        
        // Schedule periodic direction updates
        avatar.wanderInterval = setInterval(() => {
            if (!avatar.wanderToTarget) {
                clearInterval(avatar.wanderInterval);
                return;
            }

            // Calculate new direction towards target with some randomness
            const newAngle = Math.atan2(targetY - avatar.y, targetX - avatar.x);
            const newRandomOffset = (Math.random() - 0.5) * Math.PI / 2;
            
            avatar.speedX = Math.cos(newAngle + newRandomOffset) * speed;
            avatar.speedY = Math.sin(newAngle + newRandomOffset) * speed;
        }, 1000);

        // Check if avatar has reached target area
        avatar.checkInterval = setInterval(() => {
            const dx = targetX - avatar.x;
            const dy = targetY - avatar.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 20) { // Avatar has reached target
                clearInterval(avatar.wanderInterval);
                clearInterval(avatar.checkInterval);
                avatar.wanderToTarget = false;
                
                // Update wander area to stay within lunch rectangle
                avatar.wanderArea = {
                    x: adjustedLunchPosition.x,
                    y: adjustedLunchPosition.y,
                    width: adjustedLunchPosition.width - AVATAR_SIZE,
                    height: adjustedLunchPosition.height - AVATAR_SIZE
                };
                
                // Reset to normal wandering behavior
                avatar.speedX = randomDirection();
                avatar.speedY = randomDirection();
            }
        }, 100);
    });
} 