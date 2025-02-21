# Bachkreis Sheetmanagement  🎵

Welcome to Bachkreis Sheetmanagement, your all-in-one sheet music management system! This hobby project aims to simplify how orchestras and ensembles manage their sheet music collections. Built with Nuxt.js and styled with Tailwind CSS, Bachkreis Sheetmanagement is a work in progress, and we’re excited to share its journey with you.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Components Overview](#components-overview)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

- 🎼 **Find & Manage Pieces**: Effortlessly organize, search, and access your orchestra's sheet music.
- 🎻 **Assign Parts with Ease**: Simplify part assignments to orchestra members.
- 🎶 **Streamline Rehearsals**: Keep everything at your fingertips, from classical masterpieces to modern arrangements.
- 🌐 **Responsive Design**: Enjoy a seamless experience across devices with a modern and intuitive interface.
- 🌗 **Light/Dark Mode**: Switch between light and dark themes to suit your environment.

## Demo

**[Live Demo](#)** (Link coming soon!)

## Getting Started

### Prerequisites

- **Node.js** (v12 or higher)
- **npm** or **Yarn**
- Basic understanding of **Vue.js** and **Tailwind CSS**

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/Bachkreis Sheetmanagement.git
    ```

    Navigate to the Project Directory

bash
cd Bachkreis Sheetmanagement
Install Dependencies

bash
npm install
# or
yarn install
Running the App
Development Server
Start the development server with hot reload at http://localhost:3000:

bash
npm run dev
# or
yarn dev
Production Build
To build the application for production:

bash
npm run build
# or
yarn build
Then start the server:

bash
npm run start
# or
yarn start
Project Structure

Bachkreis Sheetmanagement/
├── components/
│   ├── AddEntry.vue
│   ├── Pagination.vue
│   ├── SearchBar.vue
│   ├── StueckManager.vue
│   ├── Table.vue
│   └── TableEntry.vue
├── pages/
│   ├── index.vue
│   ├── about.vue
│   └── ...
├── assets/
│   └── styles/
├── static/
├── plugins/
├── nuxt.config.js
├── package.json
└── README.md

Components Overview
Table.vue
A dynamic and responsive table component that displays sheet music entries with features like sorting, pagination, and search functionality.

Features

Sortable columns

Pagination controls

Search bar integration

Tailwind CSS styling for a modern look

TableEntry.vue
Represents each row in the table with customized cells:

Difficulty Visualization

Displays difficulty as a colored bar

Low: Green bar (25% width)

Medium: Yellow bar (50% width)

High: Orange bar (75% width)

Very High: Red bar (100% width)

Digitalization Status

Uses icons to indicate whether a piece is digitalized

Digitalized: Green checkmark

Not Digitalized: Red cross

Pagination.vue
Controls the pagination of the table entries.

Features

"Prev" and "Next" buttons

Displays current page and total pages

Disabled states when at the beginning or end

AddEntry.vue
Allows users to add new sheet music entries (feature under development).

Features

Styled button that emits events when clicked

Placeholder functionality for future implementation

StueckManager.vue
Manages the list of sheet music pieces.

Features

Renders the table with data

Handles edit and delete actions

Integrates the AddEntry component

Usage
Navigate to http://localhost:3000 to access the application. From there, you can:

View and search through the list of sheet music pieces.

Sort the list by different criteria (e.g., name, genre, year).

Use pagination controls to navigate through pages.

Toggle between light and dark modes using the switch in the interface.

Contributing
Contributions are welcome! Since this is a hobby project, any improvements, suggestions, or additions are greatly appreciated.

Fork the Project

Create your Feature Branch

bash
git checkout -b feature/AmazingFeature
Commit your Changes

bash
git commit -m 'Add some AmazingFeature'
Push to the Branch

bash
git push origin feature/AmazingFeature
Open a Pull Request

License
This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgments
Nuxt.js: For providing a powerful and flexible framework.

Tailwind CSS: For making styling efficient and enjoyable.

Heroicons: For the beautiful icons that enhance the user interface.

Lucide Icons: For the versatile icon set used in the app.

Vue.jsCommunity: For continuous support and inspiration.

You: For taking the time to explore Bachkreis Sheetmanagement!

Enjoy managing your sheet music with Bachkreis Sheetmanagement! If you have any questions or suggestions, feel free to open an issue or contribute to the project. Let's make music management harmonious together! 🎵✨
