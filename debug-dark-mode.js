// Debug script to test dark mode functionality
console.log('=== Dark Mode Debug ===');

// Check if dark class is on html element
const htmlElement = document.documentElement;
console.log('HTML element classes:', htmlElement.className);
console.log('Has dark class:', htmlElement.classList.contains('dark'));

// Check if dark class is on body element  
const bodyElement = document.body;
console.log('Body element classes:', bodyElement.className);
console.log('Body has dark class:', bodyElement.classList.contains('dark'));

// Check localStorage theme
const storedTheme = localStorage.getItem('theme');
console.log('Stored theme:', storedTheme);

// Check computed styles
const bodyStyles = window.getComputedStyle(bodyElement);
console.log('Body background color:', bodyStyles.backgroundColor);
console.log('Body color:', bodyStyles.color);

// Test manual dark mode toggle
function testToggle() {
  console.log('Testing manual toggle...');
  htmlElement.classList.toggle('dark');
  bodyElement.classList.toggle('dark');
  console.log('After toggle - HTML classes:', htmlElement.className);
  console.log('After toggle - Body classes:', bodyElement.className);
}

// Make function available globally
window.testDarkMode = testToggle;
console.log('Run testDarkMode() in console to manually test');
