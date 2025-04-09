// Avatar rendering and animation logic
const avatars = [];
const AVATAR_SIZE = 150;
const FRAME_INTERVAL = 16;
let lastFrameTime = 0;
const SCALE_FACTOR = 0.5;
let lunchCounts = {};

// Animation types enum
const AnimationStyle = {
    WALKING: 'walking',
    JUMPING: 'jumping',
    IDLE: 'idle',
    DRIVING: 'driving'
};

// Avatar appearance options
const avatarOptions = {
    topType: [
        'NoHair', 'Eyepatch', 'Hat', 'Hijab', 'Turban', 'WinterHat1', 'WinterHat2', 'WinterHat3', 'WinterHat4',
        'LongHairBigHair', 'LongHairBob', 'LongHairBun', 'LongHairCurly', 'LongHairCurvy', 'LongHairDreads',
        'LongHairFrida', 'LongHairFro', 'LongHairFroBand', 'LongHairNotTooLong', 'LongHairShavedSides',
        'LongHairMiaWallace', 'LongHairStraight', 'LongHairStraight2', 'LongHairStraightStrand',
        'ShortHairDreads01', 'ShortHairDreads02', 'ShortHairFrizzle', 'ShortHairShaggyMullet', 'ShortHairShortCurly',
        'ShortHairShortFlat', 'ShortHairShortRound', 'ShortHairShortWaved', 'ShortHairSides', 'ShortHairTheCaesar',
        'ShortHairTheCaesarSidePart'
    ],
    accessoriesType: [
        'Blank', 'Kurt', 'Prescription01', 'Prescription02', 'Round', 'Sunglasses', 'Wayfarers'
    ],
    hatColor: [
        'Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'Gray02', 'Heather', 'PastelBlue', 'PastelGreen',
        'PastelOrange', 'PastelRed', 'PastelYellow', 'Pink', 'Red', 'White'
    ],
    hairColor: [
        'Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'PastelPink', 'Platinum',
        'Red', 'SilverGray'
    ],
    facialHairType: [
        'Blank', 'BeardMedium', 'BeardLight', 'BeardMajestic', 'MoustacheFancy', 'MoustacheMagnum'
    ],
    facialHairColor: [
        'Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'Platinum', 'Red'
    ],
    clotheType: [
        'BlazerShirt', 'BlazerSweater', 'CollarSweater', 'GraphicShirt', 'Hoodie', 'Overall',
        'ShirtCrewNeck', 'ShirtScoopNeck', 'ShirtVNeck'
    ],
    clotheColor: [
        'Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'Gray02', 'Heather', 'PastelBlue',
        'PastelGreen', 'PastelOrange', 'PastelRed', 'PastelYellow', 'Pink', 'Red', 'White'
    ],
    graphicType: [
        'Bat', 'Cumbia', 'Deer', 'Diamond', 'Hola', 'Pizza', 'Resist', 'Selena', 'Bear', 'SkullOutline',
        'Skull'
    ],
    eyeType: [
        'Close', 'Cry', 'Default', 'Dizzy', 'EyeRoll', 'Happy', 'Hearts', 'Side', 'Squint', 'Surprised',
        'Wink', 'WinkWacky'
    ],
    eyebrowType: [
        'Angry', 'AngryNatural', 'Default', 'DefaultNatural', 'FlatNatural', 'RaisedExcited',
        'RaisedExcitedNatural', 'SadConcerned', 'SadConcernedNatural', 'UnibrowNatural', 'UpDown',
        'UpDownNatural'
    ],
    mouthType: [
        'Concerned', 'Default', 'Disbelief', 'Eating', 'Grimace', 'Sad', 'ScreamOpen', 'Serious',
        'Smile', 'Tongue', 'Twinkle', 'Vomit'
    ],
    skinColor: [
        'Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black'
    ]
};

// Helper functions
function randomDirection() {
    return (Math.random() - 0.5) * 6;
}

function changeDirection(avatar) {
    if (avatar.wandering) {
        avatar.speedX = randomDirection();
        avatar.speedY = randomDirection();
    }
}

function getRandomOption(category) {
    return avatarOptions[category][Math.floor(Math.random() * avatarOptions[category].length)];
}

function getApiBaseUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('apiUrl') || "0.0.0.0:7216";  // Default if not specified
}

// Animation specific functions
function setupJumpingAnimation(avatar) {
    avatar.jumpState = {
        jumping: true,
        jumpHeight: 0,
        jumpDirection: 1,
        maxJumpHeight: 30 + Math.random() * 20,
        jumpSpeed: 1.5 + Math.random() * 1.5
    };
}

function setupDrivingAnimation(avatar) {
    try {
        // Skip if avatar is not properly initialized
        if (!avatar || !avatar.element) {
            return;
        }
        
        console.log("Setting up driving animation for", avatar.name);
        
        // Store the original head position before doing anything else
        const head = avatar.element.querySelector('.head');
        if (head) {
            // Save exact head details for accurate restoration
            avatar.originalHeadDetails = {
                parent: head.parentNode,
                top: head.style.top || '-42px',
                left: head.style.left || '0px',
                position: head.style.position || '',
                zIndex: head.style.zIndex || '2',
                transform: head.style.transform || '',
                width: head.style.width || '100px'
            };
            console.log("Saved original head position:", avatar.originalHeadDetails);
        }
        
        // Explicitly hide the body if it exists
        const body = avatar.element.querySelector('img[src*="body_front"]');
        if (body) {
            console.log("Hiding body for driving animation");
            // Store original state
            avatar.originalBodyState = {
                display: body.style.display,
                visibility: body.style.visibility
            };
            body.style.display = 'none';
            body.style.visibility = 'hidden';
        }
        
        // If the avatar doesn't already have a car, add one
        if (!avatar.element.querySelector('.car-wrapper')) {
            const carWrapper = document.createElement('div');
            carWrapper.className = 'car-wrapper';
            carWrapper.style.position = 'absolute';
            carWrapper.style.top = '-18px';
            carWrapper.style.left = '-100px';
            carWrapper.style.width = '300px';
            carWrapper.style.zIndex = '500'; // Higher than head (z-index:2)
            
            const carImg = document.createElement('img');
            carImg.className = 'car';
            carImg.src = 'kenny/Player/Limbs/cabrio.png';
            carImg.style.width = '100%';
            carImg.style.transformOrigin = 'top center';
            
            carWrapper.appendChild(carImg);
            
            // Create a separate div to hold the head at a fixed position in the car
            const headContainer = document.createElement('div');
            headContainer.className = 'head-container';
            headContainer.style.position = 'absolute';
            headContainer.style.top = '-30px'; // Position for head in car
            headContainer.style.left = '100px'; // Center in car
            headContainer.style.width = '100px';
            headContainer.style.zIndex = '1'; // Above the car
            
            // Move the existing head to this container
            if (head) {
                // Remove from current parent
                head.parentNode.removeChild(head);
                
                // Reset critical styles for in-car positioning
                head.style.top = '0';
                head.style.left = '0';
                head.style.position = 'absolute';
                
                // Add to new container
                headContainer.appendChild(head);
                carWrapper.appendChild(headContainer);
            } else {
                // If no head found, just add the empty container
                carWrapper.appendChild(headContainer);
            }
            
            avatar.element.appendChild(carWrapper);
        }
        
        // Increase speed for driving (store original speeds if not already stored)
        if (!avatar.originalSpeedX) {
            avatar.originalSpeedX = avatar.speedX;
            avatar.originalSpeedY = avatar.speedY;
        }
        avatar.speedX = avatar.originalSpeedX * 2.5;
        avatar.speedY = avatar.originalSpeedY * 0.5; // Less vertical movement
        
        // Hide limbs when driving
        hideLimbs(avatar);
    } catch (error) {
        console.error(`Error setting up driving animation for avatar ${avatar.name}:`, error);
    }
}

function cleanupDrivingAnimation(avatar) {
    try {
        // Skip if avatar is not properly initialized
        if (!avatar || !avatar.element) {
            return;
        }
        
        console.log("Cleaning up driving animation for", avatar.name);
        
        // First, restore the head to its original position
        const head = avatar.element.querySelector('.head');
        const headContainer = avatar.element.querySelector('.head-container');
        
        if (head) {
            // Remove from current container
            if (head.parentNode) {
                head.parentNode.removeChild(head);
            }
            
            // Reset styles using original saved details
            if (avatar.originalHeadDetails) {
                // Apply all original styles
                head.style.position = avatar.originalHeadDetails.position;
                head.style.top = avatar.originalHeadDetails.top;
                head.style.left = avatar.originalHeadDetails.left;
                head.style.width = avatar.originalHeadDetails.width;
                head.style.zIndex = avatar.originalHeadDetails.zIndex;
                head.style.transform = avatar.originalHeadDetails.transform;
                
                // Add back to original parent
                avatar.originalHeadDetails.parent.appendChild(head);
                
                console.log("Restored head position to:", avatar.originalHeadDetails.top);
                
                // Clean up reference
                delete avatar.originalHeadDetails;
            } else {
                // Fallback if we didn't store original details
                console.log("No original head details found, using default values");
                head.style.position = '';
                head.style.top = '-42px';
                head.style.left = '';
                head.style.width = '100px';
                head.style.zIndex = '2';
                head.style.transform = '';
                
                // Add to avatar element as fallback
                avatar.element.appendChild(head);
            }
        }
        
        // Remove car wrapper regardless of animation style
        const carWrapper = avatar.element.querySelector('.car-wrapper');
        if (carWrapper) {
            console.log("Removing car wrapper");
            carWrapper.remove();
        }
        
        // Restore original speed if it was saved
        if (avatar.originalSpeedX) {
            avatar.speedX = avatar.originalSpeedX;
            avatar.speedY = avatar.originalSpeedY;
            delete avatar.originalSpeedX;
            delete avatar.originalSpeedY;
        }
        
        // Show limbs again
        showLimbs(avatar);
        
        // Restore body visibility if it was hidden
        const body = avatar.element.querySelector('img[src*="body_front"]');
        if (body) {
            if (avatar.originalBodyState) {
                body.style.display = avatar.originalBodyState.display || '';
                body.style.visibility = avatar.originalBodyState.visibility || '';
                delete avatar.originalBodyState;
            } else {
                body.style.display = '';
                body.style.visibility = '';
            }
        }
        
        // Force a complete redraw of the avatar
        avatar.element.style.display = 'none';
        setTimeout(() => {
            avatar.element.style.display = '';
            // Double check head position after redraw
            const headAfterRedraw = avatar.element.querySelector('.head');
            if (headAfterRedraw && headAfterRedraw.style.top !== '-42px') {
                console.log("Forcing head position to -42px after redraw");
                headAfterRedraw.style.top = '-42px';
            }
        }, 10);
    } catch (error) {
        console.error(`Error cleaning up driving animation for avatar ${avatar.name}:`, error);
    }
}

function hideLimbs(avatar) {
    if (!avatar || !avatar.element) return;
    
    console.log("Hiding limbs for", avatar.name);
    
    // Store original display state if not already stored
    if (!avatar.limbsDisplayState) {
        avatar.limbsDisplayState = {};
        
        const limbs = avatar.element.querySelectorAll('.left-arm-wrapper, .right-arm-wrapper, .left-leg-wrapper, .right-leg-wrapper');
        limbs.forEach((limb, index) => {
            if (limb) {
                avatar.limbsDisplayState[index] = {
                    display: limb.style.display,
                    visibility: limb.style.visibility
                };
                limb.style.display = 'none';
                limb.style.visibility = 'hidden';
            }
        });
    } else {
        // If state was already stored, just hide them
        const limbs = avatar.element.querySelectorAll('.left-arm-wrapper, .right-arm-wrapper, .left-leg-wrapper, .right-leg-wrapper');
        limbs.forEach(limb => {
            if (limb) {
                limb.style.display = 'none';
                limb.style.visibility = 'hidden';
            }
        });
    }
}

function showLimbs(avatar) {
    if (!avatar || !avatar.element) return;
    
    console.log("Showing limbs for", avatar.name);
    
    const limbs = avatar.element.querySelectorAll('.left-arm-wrapper, .right-arm-wrapper, .left-leg-wrapper, .right-leg-wrapper');
    
    if (avatar.limbsDisplayState) {
        // Restore from saved state
        limbs.forEach((limb, index) => {
            if (limb && avatar.limbsDisplayState[index]) {
                limb.style.display = avatar.limbsDisplayState[index].display || '';
                limb.style.visibility = avatar.limbsDisplayState[index].visibility || '';
            } else if (limb) {
                // Fallback if state wasn't saved
                limb.style.display = '';
                limb.style.visibility = '';
            }
        });
        
        // Clean up the stored state
        delete avatar.limbsDisplayState;
    } else {
        // Just show all limbs if no state was stored
        limbs.forEach(limb => {
            if (limb) {
                limb.style.display = '';
                limb.style.visibility = '';
            }
        });
    }
}

function updateJumpingAnimation(avatar, jumpOffset) {
    // Check if jumpState exists
    if (!avatar.jumpState) {
        // If there's no jump state, create it
        setupJumpingAnimation(avatar);
    }
    
    // Now we're sure avatar.jumpState exists
    // Calculate jump position
    avatar.jumpState.jumpHeight += avatar.jumpState.jumpDirection * avatar.jumpState.jumpSpeed;
    
    // Switch direction when reaching max height or ground
    if (avatar.jumpState.jumpHeight >= avatar.jumpState.maxJumpHeight) {
        avatar.jumpState.jumpDirection = -1; // Start falling
    } else if (avatar.jumpState.jumpHeight <= 0) {
        avatar.jumpState.jumpDirection = 1; // Start jumping again
        
        // Sometimes end jumping animation
        if (Math.random() < 0.1) {
            avatar.animationStyle = AnimationStyle.WALKING;
            avatar.jumpState = null;
            return 0; // No jump offset when switching to walking
        }
    }
    
    return avatar.jumpState.jumpHeight;
}

function applyWalkingAnimation(avatar, isMovingLeft) {
    try {
        if (!avatar || !avatar.element) return;
        
        // Enable CSS animations by removing the disable-animations class
        avatar.element.classList.remove('disable-animations');
        
        const leftArmWrapper = avatar.element.querySelector('.left-arm-wrapper');
        const rightArmWrapper = avatar.element.querySelector('.right-arm-wrapper');
        const leftLegWrapper = avatar.element.querySelector('.left-leg-wrapper');
        const rightLegWrapper = avatar.element.querySelector('.right-leg-wrapper');
        
        // Let the CSS animations handle the limb movement
        if (leftArmWrapper) {
            leftArmWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
            leftArmWrapper.style.transformOrigin = 'top center';
        }
        if (rightArmWrapper) {
            rightArmWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
            rightArmWrapper.style.transformOrigin = 'top center';
        }
        
        if (leftLegWrapper) {
            leftLegWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
            leftLegWrapper.style.transformOrigin = 'top center';
        }
        if (rightLegWrapper) {
            rightLegWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
            rightLegWrapper.style.transformOrigin = 'top center';
        }
    } catch (error) {
        console.error("Error in walking animation:", error);
    }
}

function applyJumpingAnimation(avatar, isMovingLeft) {
    try {
        if (!avatar || !avatar.element) return;
        
        // Disable CSS animations by adding the disable-animations class
        avatar.element.classList.add('disable-animations');
        
        const leftArmWrapper = avatar.element.querySelector('.left-arm-wrapper');
        const rightArmWrapper = avatar.element.querySelector('.right-arm-wrapper');
        const leftLegWrapper = avatar.element.querySelector('.left-leg-wrapper');
        const rightLegWrapper = avatar.element.querySelector('.right-leg-wrapper');
        
        // Jumping animation - arms up and legs extended
        if (leftArmWrapper) {
            leftArmWrapper.style.transform = `${isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)'} rotate(-60deg)`;
            leftArmWrapper.style.transformOrigin = 'top center';
        }
        if (rightArmWrapper) {
            rightArmWrapper.style.transform = `${isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)'} rotate(-60deg)`;
            rightArmWrapper.style.transformOrigin = 'top center';
        }
        
        // Legs spread a bit for jumping
        if (leftLegWrapper) {
            leftLegWrapper.style.transform = `${isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)'} rotate(-15deg)`;
            leftLegWrapper.style.transformOrigin = 'top center';
        }
        if (rightLegWrapper) {
            rightLegWrapper.style.transform = `${isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)'} rotate(15deg)`;
            rightLegWrapper.style.transformOrigin = 'top center';
        }
    } catch (error) {
        console.error("Error in jumping animation:", error);
    }
}

function applyIdleAnimation(avatar, isMovingLeft) {
    try {
        if (!avatar || !avatar.element) return;
        
        // Disable CSS animations by adding the disable-animations class
        avatar.element.classList.add('disable-animations');
        
        const leftArmWrapper = avatar.element.querySelector('.left-arm-wrapper');
        const rightArmWrapper = avatar.element.querySelector('.right-arm-wrapper');
        const leftLegWrapper = avatar.element.querySelector('.left-leg-wrapper');
        const rightLegWrapper = avatar.element.querySelector('.right-leg-wrapper');
        
        // Idle animation - subtle breathing movement
        const breathCycle = (Date.now() % 2000) / 2000; // 0 to 1 over 2 seconds
        const breathScale = 1 + Math.sin(breathCycle * Math.PI * 2) * 0.02; // 0.98 to 1.02
        
        avatar.element.style.transform = `translate(${avatar.x}px, ${avatar.y}px) scale(${breathScale})`;
        
        // Reset arm and leg positions
        if (leftArmWrapper) {
            leftArmWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
        }
        if (rightArmWrapper) {
            rightArmWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
        }
        if (leftLegWrapper) {
            leftLegWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
        }
        if (rightLegWrapper) {
            rightLegWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
        }
    } catch (error) {
        console.error("Error in idle animation:", error);
    }
}

function applyDrivingAnimation(avatar, isMovingLeft) {
    try {
        if (!avatar || !avatar.element) return;
        
        // Disable CSS animations by adding the disable-animations class
        avatar.element.classList.add('disable-animations');
        
        const carWrapper = avatar.element.querySelector('.car-wrapper');
        if (carWrapper) {
            carWrapper.style.transform = isMovingLeft ? 'scaleX(1)' : 'scaleX(-1)';
            carWrapper.style.zIndex = '5'; // Ensure car is above body
            
            // Add car bouncing effect
            const bumpCycle = (Date.now() % 500) / 500; // 0 to 1 over 0.5 seconds
            const bumpOffset = Math.sin(bumpCycle * Math.PI * 2) * 2; // -2 to 2 pixels
            carWrapper.style.top = `${-18 + bumpOffset}px`;
            
            // No need to manipulate head position now, since it's in a fixed container
        }
    } catch (error) {
        console.error("Error in driving animation:", error);
    }
}

// Animation and creation
function animateAvatars(timestamp) {
    if (timestamp - lastFrameTime < FRAME_INTERVAL) {
        requestAnimationFrame(animateAvatars);
        return;
    }
    lastFrameTime = timestamp;

    avatars.forEach(avatar => {
        if (!avatar || !avatar.element) {
            // Skip this avatar if it's not properly initialized
            return;
        }
        
        if (avatar.wandering) {
            // Movement logic
            avatar.x += avatar.speedX;
            avatar.y += avatar.speedY;

            const { x, y, width, height } = avatar.wanderArea;

            if (avatar.x < x) {
                avatar.x = x;
                avatar.speedX = Math.abs(avatar.speedX);
            } else if (avatar.x > x + width) {
                avatar.x = x + width;
                avatar.speedX = -Math.abs(avatar.speedX);
            }

            if (avatar.y < y) {
                avatar.y = y;
                avatar.speedY = Math.abs(avatar.speedY);
            } else if (avatar.y > y + height) {
                avatar.y = y + height;
                avatar.speedY = -Math.abs(avatar.speedY);
            }
            
            // Apply jump animation if jumping
            let jumpOffset = 0;
            if (avatar.animationStyle === AnimationStyle.JUMPING) {
                try {
                    jumpOffset = updateJumpingAnimation(avatar, jumpOffset);
                } catch (error) {
                    console.error("Error in jump animation:", error);
                    // Reset animation to walking if there's an error
                    avatar.animationStyle = AnimationStyle.WALKING;
                    avatar.jumpState = null;
                }
            }

            // Apply the transform with jump offset if applicable
            if (avatar.animationStyle !== AnimationStyle.IDLE) {
                avatar.element.style.transform = `translate(${avatar.x}px, ${avatar.y - jumpOffset}px)`;
            }
        }

        const isMovingLeft = avatar.speedX < 0;
        
        // Apply animation specific styling based on animation type
        if (avatar.name === "Dick Pro4all" && avatar.animationStyle !== AnimationStyle.DRIVING) {
            // Dick Pro4all has a special car animation by default
            const carWrapper = avatar.element.querySelector('.car-wrapper');
            if (carWrapper) {
                carWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
            }
        } else {
            // Common transformations for orientation first
            updateLimbOrientation(avatar, isMovingLeft);
            
            // Then apply specific animation
            switch (avatar.animationStyle) {
                case AnimationStyle.WALKING:
                    applyWalkingAnimation(avatar, isMovingLeft);
                    break;
                case AnimationStyle.JUMPING:
                    applyJumpingAnimation(avatar, isMovingLeft);
                    break;
                case AnimationStyle.IDLE:
                    applyIdleAnimation(avatar, isMovingLeft);
                    break;
                case AnimationStyle.DRIVING:
                    applyDrivingAnimation(avatar, isMovingLeft);
                    break;
            }
        }
    });
    requestAnimationFrame(animateAvatars);
}

function updateLimbOrientation(avatar, isMovingLeft) {
    const leftArmWrapper = avatar.element.querySelector('.left-arm-wrapper');
    const rightArmWrapper = avatar.element.querySelector('.right-arm-wrapper');
    const leftLegWrapper = avatar.element.querySelector('.left-leg-wrapper');
    const rightLegWrapper = avatar.element.querySelector('.right-leg-wrapper');

    // Only set base orientation if not in driving mode (which hides limbs)
    if (avatar.animationStyle !== AnimationStyle.DRIVING) {
        if (leftLegWrapper) leftLegWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
        if (rightLegWrapper) rightLegWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
        if (leftArmWrapper) leftArmWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
        if (rightArmWrapper) rightArmWrapper.style.transform = isMovingLeft ? 'scaleX(-1)' : 'scaleX(1)';
        if (leftArmWrapper) leftArmWrapper.style.zIndex = isMovingLeft ? '-1' : '1';
        if (rightArmWrapper) rightArmWrapper.style.zIndex = isMovingLeft ? '1' : '-1';
    }
}

async function loadAvatars() {
    try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/avatar/present`);
        if (!response.ok) {
            throw new Error('Failed to fetch avatars');
        }
        const avatarData = await response.json();

        // Keep track of existing avatars by name
        const existingAvatarsByName = new Map(
            avatars.map(avatar => [avatar.name, avatar])
        );

        // Remove avatars that are no longer present
        avatars.forEach((avatar, index) => {
            if (!avatarData.find(data => data.name === avatar.name)) {
                avatar.element.remove();
                avatars.splice(index, 1);
            }
        });

        // Update or create avatars
        avatarData.forEach(data => {
            const existingAvatar = existingAvatarsByName.get(data.name);

            if (existingAvatar) {
                // Update existing avatar's appearance only
                const head = existingAvatar.element.querySelector('.head');
                head.src = buildAvatarUrl(data.options);
                
                // Ensure existing avatars are also set to walking animation
                if (existingAvatar.animationStyle !== AnimationStyle.WALKING) {
                    // Clean up any previous animation specific elements
                    if (existingAvatar.animationStyle === AnimationStyle.DRIVING) {
                        cleanupDrivingAnimation(existingAvatar);
                    }
                    
                    existingAvatar.animationStyle = AnimationStyle.WALKING;
                    existingAvatar.jumpState = null;
                }
            } else {
                // Create new avatar
                const avatar = document.createElement('div');
                avatar.className = 'avatar';

                renderAvatarHTML(avatar, data);
                document.body.appendChild(avatar);

                // Set walking as the default animation style instead of random
                const initialStyle = AnimationStyle.WALKING;

                const avatarObj = {
                    element: avatar,
                    x: Math.random() * (window.innerWidth / SCALE_FACTOR - AVATAR_SIZE),
                    y: Math.random() * (window.innerHeight / SCALE_FACTOR - AVATAR_SIZE),
                    speedX: randomDirection(),
                    speedY: randomDirection(),
                    wandering: true,
                    wanderArea: {
                        x: 0,
                        y: 0,
                        width: window.innerWidth / SCALE_FACTOR - AVATAR_SIZE,
                        height: window.innerHeight / SCALE_FACTOR - AVATAR_SIZE
                    },
                    name: data.name,
                    animationStyle: initialStyle,
                    jumpState: null
                };

                // No special setup needed since we're only using walking animation

                avatars.push(avatarObj);
                setInterval(() => changeDirection(avatarObj), Math.random() * 5000 + 2000);
            }
        });

        generateQRCode();
    } catch (error) {
        console.error('Error creating avatars:', error);
    }
}

function buildAvatarUrl(options) {
    return `https://avataaars.io/?avatarStyle=Transparent&topType=${options.topType}&accessoriesType=${options.accessoriesType}&hatColor=${options.hatColor || 'Black'}&hairColor=${options.hairColor || 'BrownDark'}&facialHairType=${options.facialHairType || 'Blank'}&facialHairColor=${options.facialHairColor || 'Brown'}&clotheType=${options.clotheType || 'BlazerShirt'}&clotheColor=${options.clotheColor || 'Black'}&graphicType=${options.graphicType || 'Diamond'}&eyeType=${options.eyeType || 'Default'}&eyebrowType=${options.eyebrowType || 'Default'}&mouthType=${options.mouthType || 'Default'}&skinColor=${options.skinColor || 'Light'}`;
}

function renderAvatarHTML(avatar, data) {
    const nameTopPosition = data.name === "Martijn Pro4all" ? '-90px' : '-70px';
    
    if (data.name === "Dick Pro4all") {
        avatar.innerHTML = `
            <div class="name-label" style="position:absolute; top:${nameTopPosition}; width:100px; text-align:center; font-family: Arial; font-size: 14px; color: #333; white-space: nowrap; z-index:4;">
                ${data.name.split(' ')[0]}
            </div>
            <img class="head" src="${buildAvatarUrl(data.options)}" style="position:absolute; top:-42px; left:0px; width:100px; clip-path: inset(0% 0% 28% 0%); z-index:2;">
            <div class="car-wrapper" style="position:absolute; top:-18px; left:-100px; width:300px; z-index:1; ">
                <img class="car" src="kenny/Player/Limbs/cabrio.png" style="width:100%; transform-origin: top center; transform: scaleX(-1);">
            </div>
        `;
    } else {
        var avatarBody = `<img src="kenny/Player/Limbs/body_front.png" style="position:absolute; top:30px; left:15px; width:60px; z-index:1; ">`;
        if (data.name === "Tycho Pro4all") {
            avatarBody = `<img src="kenny/Player/Limbs/body_front_tycho.png" style="position:absolute; top:30px; left:15px; width:60px; z-index:1; ">`;
        }

        var avatarHeadExtra = ``;
        if (data.name === "Martijn Pro4all") {
            avatarHeadExtra = `<img src="kenny/Player/Limbs/chicken.png" style="position:absolute; top:-72px; left:20px; width:60px; z-index:3; ">`;
        }

        avatar.innerHTML = `
            <div class="name-label" style="position:absolute; top:${nameTopPosition}; width:100px; text-align:center; font-family: Arial; font-size: 14px; color: #333; white-space: nowrap; z-index:4;">
                ${data.name.split(' ')[0]}
            </div>
            ${avatarHeadExtra}
            <img class="head" src="${buildAvatarUrl(data.options)}" style="position:absolute; top:-42px; left:0px; width:100px; clip-path: inset(0% 0% 28% 0%); z-index:2;">
            ${avatarBody}
            <div class="left-arm-wrapper" style="position:absolute; top:31px; left:10px; width:24px;">
                <img class="arm left-arm" src="kenny/Player/Limbs/arm.png" style="width:100%; transform-origin: top center;">
            </div>
            <div class="right-arm-wrapper" style="position:absolute; top:31px; left:60px; width:24px;">
                <img class="arm right-arm" src="kenny/Player/Limbs/arm.png" style="width:100%; transform-origin: top center; transform: scaleX(-1);">
            </div>
            <div class="left-leg-wrapper" style="position:absolute; top:75px; left:22px; width:28px;">
                <img class="leg left-leg" src="kenny/Player/Limbs/leg.png" style="width:100%; transform-origin: top center;">
            </div>
            <div class="right-leg-wrapper" style="position:absolute; top:75px; left:54px; width:28px;">
                <img class="leg right-leg" src="kenny/Player/Limbs/leg.png" style="width:100%; transform-origin: top center;">
            </div>
        `;
    }
}

function generateQRCode() {
    // Generate Avatar Editor QR Code
    const qr = qrcode(0, 'M');
    const editorUrl = window.location.href.replace('Main.html', 'AvatarEditor.html');
    qr.addData(editorUrl);
    qr.make();

    const qrHtml = qr.createImgTag(4);
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = qrHtml;

    qrContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    qrContainer.style.padding = '10px';
    qrContainer.style.borderRadius = '8px';

    // Generate Vote Button QR Code
    const voteQr = qrcode(0, 'M');
    const baseUrl = getApiBaseUrl();
    const voteButtonUrl = window.location.href.replace('Main.html', 'VoteButton.html');
    const urlWithParams = baseUrl ? `${voteButtonUrl}?apiUrl=${encodeURIComponent(baseUrl)}` : voteButtonUrl;
    voteQr.addData(urlWithParams);
    voteQr.make();

    const voteQrHtml = voteQr.createImgTag(4);
    const voteQrContainer = document.getElementById('vote-qrcode');
    voteQrContainer.innerHTML = voteQrHtml;

    voteQrContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    voteQrContainer.style.padding = '10px';
    voteQrContainer.style.borderRadius = '8px';
}

function makeSurprised() {
    avatars.forEach(avatar => {
        const head = avatar.element.querySelector('.head');
        const currentUrl = new URL(head.src);
        const params = new URLSearchParams(currentUrl.search);

        // Store original eyeType
        const originalEyeType = params.get('eyeType');

        params.set('eyeType', 'Surprised');

        // Construct new URL while preserving other parameters
        const newUrl = `https://avataaars.io/?${params.toString()}`;
        head.src = newUrl;

        // Reset back to original after 2 seconds
        setTimeout(() => {
            params.set('eyeType', originalEyeType);
            head.src = `https://avataaars.io/?${params.toString()}`;
        }, 2000);
    });
}

// Function to create a speech bubble for an avatar
function createSpeechBubble(avatar) {
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.textContent = avatar.selectedLunch;
    bubble.style.position = 'absolute';
    bubble.style.backgroundColor = 'white';
    bubble.style.padding = '8px 15px';
    bubble.style.borderRadius = '20px';
    bubble.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    bubble.style.maxWidth = '200px';
    bubble.style.wordWrap = 'break-word';
    bubble.style.textAlign = 'center';
    bubble.style.fontFamily = 'Arial, sans-serif';
    bubble.style.fontSize = '14px';
    bubble.style.zIndex = '1001';
    bubble.style.transform = 'translateX(-50%)';
    
    // Add a little tail to the speech bubble
    bubble.style.position = 'relative';
    bubble.style.marginBottom = '10px';
    bubble.style.border = '1px solid #ddd';
    
    // Add the bubble to the avatar element
    avatar.element.appendChild(bubble);
    
    // Position the bubble above the avatar
    bubble.style.position = 'absolute';
    bubble.style.bottom = '180px';
    bubble.style.left = '50px';
    
    // Add a tail to the speech bubble
    bubble.style.after = `
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 10px 10px 0;
        border-style: solid;
        border-color: white transparent transparent;
    `;
    
    // Add CSS for the speech bubble tail using a pseudo-element
    const style = document.createElement('style');
    style.textContent = `
        .speech-bubble:after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 10px 10px 0;
            border-style: solid;
            border-color: white transparent transparent;
        }
    `;
    document.head.appendChild(style);
    
    // Add animation to the speech bubble
    bubble.style.opacity = '0';
    bubble.style.transform = 'translateY(20px) translateX(-50%)';
    bubble.style.transition = 'opacity 0.5s, transform 0.5s';
    
    setTimeout(() => {
        bubble.style.opacity = '1';
        bubble.style.transform = 'translateY(0) translateX(-50%)';
    }, 10);
    
    // Speech bubbles will remain visible permanently (no auto-hide)
}

// Function to show lunch choices
async function showLunchChoices() {
    try {
        // Remove any existing speech bubbles first
        document.querySelectorAll('.speech-bubble').forEach(bubble => bubble.remove());
        
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
            
            // Only create a speech bubble if they ordered something
            if (lunch !== 'Niet besteld!') {
                createSpeechBubble(avatar);
            }
        });

        // Update lunch counts based on actual selections
        lunchCounts = {};
        avatars.forEach(avatar => {
            lunchCounts[avatar.selectedLunch] = (lunchCounts[avatar.selectedLunch] || 0) + 1;
        });

        // Make avatars look surprised
        makeSurprised();

    } catch (error) {
        console.error('Error fetching lunch data:', error);
    }
}

function startAnimation() {
    requestAnimationFrame(animateAvatars);
}

// Function to set animation style for all avatars or a specific avatar
function setAnimationStyle(style, avatarName = null) {
    if (!Object.values(AnimationStyle).includes(style)) {
        console.error(`Invalid animation style: ${style}`);
        return;
    }
    
    const avatarsToUpdate = avatarName 
        ? avatars.filter(avatar => avatar.name === avatarName)
        : avatars;
    
    avatarsToUpdate.forEach(avatar => {
        try {
            // Skip if avatar is not properly initialized
            if (!avatar || !avatar.element) {
                return;
            }
            
            console.log(`Changing animation style for ${avatar.name} from ${avatar.animationStyle} to ${style}`);
            
            // Clean up any previous animation specific elements
            const previousStyle = avatar.animationStyle;
            
            if (previousStyle === AnimationStyle.DRIVING) {
                console.log("Cleaning up driving animation before switching styles");
                cleanupDrivingAnimation(avatar);
            }
            
            // Set the new animation style
            avatar.animationStyle = style;
            
            // Setup for the new animation style
            if (style === AnimationStyle.JUMPING) {
                setupJumpingAnimation(avatar);
            } else if (style === AnimationStyle.DRIVING) {
                setupDrivingAnimation(avatar);
            } else {
                avatar.jumpState = null;
            }
        } catch (error) {
            console.error(`Error setting animation style for avatar ${avatar.name}:`, error);
            // Reset to walking as fallback
            avatar.animationStyle = AnimationStyle.WALKING;
            avatar.jumpState = null;
        }
    });
}

// Function to find an avatar by its first name
function getAvatarByFirstName(firstName) {
    return avatars.find(avatar => avatar.name.split(' ')[0] === firstName);
}

// Function to get all avatars
function getAvatars() {
    return avatars;
}

// Export functions to be used in Main.html
window.AvatarManager = {
    loadAvatars,
    startAnimation,
    showLunchChoices,
    generateQRCode,
    makeSurprised,
    getApiBaseUrl,
    setAnimationStyle,
    AnimationStyle,
    getAvatarByFirstName,
    getAvatars
}; 