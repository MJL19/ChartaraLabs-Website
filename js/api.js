// API Configuration
const API_BASE_URL = 'https://ctiakq7w39.execute-api.us-east-2.amazonaws.com/prod';

// API Helper Functions
class ChartaraAPI {
    static async validateToken(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/validate-token?token=${encodeURIComponent(token)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error validating token:', error);
            throw new Error('Failed to validate setup token. Please check your internet connection.');
        }
    }

    static async setPassword(token, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/set-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error setting password:', error);
            if (error.message.includes('HTTP error')) {
                throw error;
            }
            throw new Error('Failed to set password. Please check your internet connection.');
        }
    }

    static async createTeamMembers(adminEmail, teamMembers) {
        try {
            const response = await fetch(`${API_BASE_URL}/team-setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admin_email: adminEmail,
                    team_members: teamMembers
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error creating team members:', error);
            if (error.message.includes('HTTP error')) {
                throw error;
            }
            throw new Error('Failed to create team members. Please check your internet connection.');
        }
    }
}

// Utility Functions
class Utils {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };

        return {
            requirements,
            isValid: Object.values(requirements).every(req => req)
        };
    }

    static getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static showLoading(element, show = true) {
        if (show) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }

    static showError(container, message) {
        const errorElement = container.querySelector('#error-message');
        if (errorElement) {
            errorElement.textContent = message;
        }
        container.style.display = 'block';
    }

    static debounce(func, wait) {
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
}

// Form Validation Helpers
class FormValidator {
    static setupPasswordValidation(passwordInput, confirmPasswordInput, submitButton, requirementsContainer) {
        const debouncedValidation = Utils.debounce(() => {
            this.validatePasswordRequirements(passwordInput, requirementsContainer);
            this.validatePasswordMatch(passwordInput, confirmPasswordInput);
            this.updateSubmitButton(passwordInput, confirmPasswordInput, submitButton);
        }, 300);

        passwordInput.addEventListener('input', debouncedValidation);
        confirmPasswordInput.addEventListener('input', debouncedValidation);
    }

    static validatePasswordRequirements(passwordInput, requirementsContainer) {
        const password = passwordInput.value;
        const validation = Utils.validatePassword(password);

        // Update requirement indicators
        const requirements = requirementsContainer.querySelectorAll('li');
        const reqTypes = ['length', 'uppercase', 'lowercase', 'number', 'special'];

        reqTypes.forEach((type, index) => {
            if (requirements[index]) {
                requirements[index].classList.toggle('valid', validation.requirements[type]);
            }
        });

        passwordInput.classList.toggle('valid', validation.isValid);
        return validation.isValid;
    }

    static validatePasswordMatch(passwordInput, confirmPasswordInput) {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const matchContainer = document.getElementById('password-match');

        if (!matchContainer) return false;

        if (confirmPassword.length === 0) {
            matchContainer.textContent = '';
            confirmPasswordInput.classList.remove('valid', 'invalid');
            return false;
        }

        const passwordsMatch = password === confirmPassword;

        if (passwordsMatch) {
            matchContainer.textContent = '✓ Passwords match';
            matchContainer.className = 'password-match valid';
            confirmPasswordInput.classList.add('valid');
            confirmPasswordInput.classList.remove('invalid');
        } else {
            matchContainer.textContent = '✗ Passwords do not match';
            matchContainer.className = 'password-match invalid';
            confirmPasswordInput.classList.add('invalid');
            confirmPasswordInput.classList.remove('valid');
        }

        return passwordsMatch;
    }

    static updateSubmitButton(passwordInput, confirmPasswordInput, submitButton) {
        const passwordValid = Utils.validatePassword(passwordInput.value).isValid;
        const passwordsMatch = passwordInput.value === confirmPasswordInput.value && confirmPasswordInput.value.length > 0;

        submitButton.disabled = !(passwordValid && passwordsMatch);
    }

    static validateTeamMemberInputs(container) {
        const memberInputs = container.querySelectorAll('.team-member-input');
        const teamMembers = [];
        let allValid = true;

        memberInputs.forEach(input => {
            const nameInput = input.querySelector('.member-name');
            const emailInput = input.querySelector('.member-email');
            
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();

            // Clear previous validation states
            nameInput.classList.remove('invalid');
            emailInput.classList.remove('invalid');

            if (name && email) {
                if (!Utils.validateEmail(email)) {
                    emailInput.classList.add('invalid');
                    allValid = false;
                } else {
                    teamMembers.push({ name, email });
                }
            } else if (name || email) {
                // If one field is filled but not the other
                if (!name) nameInput.classList.add('invalid');
                if (!email) emailInput.classList.add('invalid');
                allValid = false;
            }
            // If both are empty, that's okay (user can remove the input)
        });

        return { allValid, teamMembers };
    }
}

// Error Handling
class ErrorHandler {
    static handleAPIError(error, context = '') {
        console.error(`API Error${context ? ` in ${context}` : ''}:`, error);

        if (error.message.includes('Failed to fetch')) {
            return 'Network error. Please check your internet connection and try again.';
        }

        if (error.message.includes('HTTP error! status: 400')) {
            return 'Invalid request. Please check your input and try again.';
        }

        if (error.message.includes('HTTP error! status: 403')) {
            return 'Access denied. Please contact support if this continues.';
        }

        if (error.message.includes('HTTP error! status: 500')) {
            return 'Server error. Please try again in a few minutes.';
        }

        return error.message || 'An unexpected error occurred. Please try again.';
    }

    static showUserFriendlyError(message, container) {
        const userMessage = this.handleAPIError(new Error(message));
        Utils.showError(container, userMessage);
    }
}

// Loading States
class LoadingManager {
    static setButtonLoading(button, isLoading, loadingText = 'Loading...', originalText = null) {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = originalText || button.textContent;
            button.textContent = loadingText;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || originalText || button.textContent;
        }
    }

    static showPageLoading(show = true) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }
}

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChartaraAPI,
        Utils,
        FormValidator,
        ErrorHandler,
        LoadingManager
    };
}

// Make available globally for script tags
window.ChartaraAPI = ChartaraAPI;
window.Utils = Utils;
window.FormValidator = FormValidator;
window.ErrorHandler = ErrorHandler;
window.LoadingManager = LoadingManager;
