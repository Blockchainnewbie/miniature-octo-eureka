{
  "name": "navaro-frontend",
  "version": "1.0.0",
  "description": "Navaro Vehicle Control Interface Frontend",
  "main": "dashboard.html",
  "scripts": {
    "start": "python3 -m http.server 8080",
    "test": "echo \"Tests will be run by GitHub Actions\"",
    "lint": "eslint *.js",
    "validate": "html-validate *.html"
  },
  "keywords": ["navaro", "vehicle-control", "rescue", "frontend"],
  "author": "Navaro Team",
  "license": "MIT",
  "dependencies": {
    "bootstrap": "^5.3.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "html-validate": "^8.0.0",
    "stylelint": "^15.0.0",
    "stylelint-config-standard": "^34.0.0"
  }
}