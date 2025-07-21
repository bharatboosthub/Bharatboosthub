// FILE: js/footer.js
// This script dynamically creates and injects a consistent footer into every page.

const footerHTML = `
<footer class="bg-gray-800 text-white mt-20">
    <div class="container mx-auto px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- About Section -->
            <div class="col-span-1 md:col-span-2">
                <h3 class="text-xl font-bold mb-4">BharatBoostHub</h3>
                <p class="text-gray-400 max-w-md">
                    Your one-stop solution to amplify your YouTube presence. We help creators reach a wider audience through community-driven promotion.
                </p>
            </div>
            
            <!-- Quick Links Section -->
            <div>
                <h4 class="font-semibold text-lg mb-4">Quick Links</h4>
                <ul class="space-y-2 text-gray-400">
                    <li><a href="index.html" class="hover:text-white transition-colors">Home</a></li>
                    <li><a href="about.html" class="hover:text-white transition-colors">About Us</a></li>
                    <li><a href="contact.html" class="hover:text-white transition-colors">Contact Us</a></li>
                    <li><a href="dashboard.html" class="hover:text-white transition-colors">My Dashboard</a></li>
                </ul>
            </div>

            <!-- Legal Section -->
            <div>
                <h4 class="font-semibold text-lg mb-4">Legal</h4>
                <ul class="space-y-2 text-gray-400">
                    <li><a href="privacy.html" class="hover:text-white transition-colors">Privacy Policy</a></li>
                    <li><a href="terms.html" class="hover:text-white transition-colors">Terms and Conditions</a></li>
                    <li><a href="disclaimer.html" class="hover:text-white transition-colors">Disclaimer</a></li>
                </ul>
            </div>
        </div>
        <div class="mt-10 border-t border-gray-700 pt-6 text-center text-gray-500">
            <p>&copy; ${new Date().getFullYear()} Bharat Boost Hub. All Rights Reserved.</p>
        </div>
    </div>
</footer>
`;

// Find the designated container div and inject the footer HTML.
// This ensures that any page with <div id="footer-container"></div> will get the footer.
const footerContainer = document.getElementById('footer-container');
if (footerContainer) {
    footerContainer.innerHTML = footerHTML;
}
