import { shuffleArray } from './utils.js'
import { getUid } from '../data/authentication.js'
import { getQuestions } from '../data/database-client.js'

// DOM Elements
const nameScreen = document.getElementById('name-screen')
const nameInput = document.getElementById('player-name')
const nameSubmitBtn = document.getElementById('name-submit')
const displayName = document.getElementById('display-name')
const categorySelectionView = document.getElementById('category-selection-view')

// Quiz State
let playerName = ''

// Hamburger Menu Logic
const hamburgerMenu = document.querySelector('.hamburger-menu')
const navMenu = document.querySelector('.nav-menu')

if (hamburgerMenu && navMenu) {
  hamburgerMenu.addEventListener('click', () => {
    navMenu.classList.toggle('open')
    const isOpen = navMenu.classList.contains('open')
    hamburgerMenu.setAttribute('aria-expanded', isOpen.toString())
    hamburgerMenu.classList.toggle('open', isOpen)
  })
} else {
  if (document.getElementById('landing-page')) {
    console.error(
      'Hamburger menu (.hamburger-menu) or navigation menu (.nav-menu) not found in index.html!'
    )
  }
}

// Name Submission Handler
if (nameSubmitBtn) {
  nameSubmitBtn.addEventListener('click', () => {
    playerName = nameInput.value.trim()
    if (!playerName) {
      alert('Please enter your name to continue.')
      return
    }

    // Store player name in localStorage for use in quiz
    localStorage.setItem('playerName', playerName)

    // Update UI to show welcome message
    displayName.textContent = playerName

    // Switch views
    nameScreen.classList.remove('active')
    categorySelectionView.classList.add('active')
  })
}

// Category Selection Logic
const categoryButtons = document.querySelectorAll('.category-btn')

categoryButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    if (!playerName) {
      // Fallback in case they somehow skipped name input
      playerName = localStorage.getItem('playerName') || 'Player'
    }

    const category = button.dataset.category // Get category from data-category attribute
    if (!category) {
      console.error('Data-category attribute not found on button:', button)
      alert('Could not determine the quiz category. Please try again.')
      return
    }

    const uid = getUid()
    if (!uid) {
      console.error('User ID not available. Cannot fetch questions.')
      alert('You need to be logged in to start a quiz.')
      return
    }

    console.log(
      `Attempting to start quiz for category: "${category}", User ID: "${uid}", Player: "${playerName}"`
    )

    try {
      const returnObject = await getQuestions(uid, category)

      if (returnObject.status === 'success') {
        const allQuestions = returnObject.data

        if (
          !allQuestions ||
          !Array.isArray(allQuestions) ||
          allQuestions.length === 0
        ) {
          console.warn(
            `No questions returned or data is empty for category: ${category}`
          )
          alert(
            `Sorry, no questions are currently available for the category: ${category}.`
          )
          return
        }

        // Shuffle questions and take the first 10 (or fewer if not enough available)
        const quizQuestions = shuffleArray(allQuestions).slice(0, 10)

        if (quizQuestions.length === 0) {
          alert(
            `Not enough questions could be prepared for the category: ${category}. Please try another one.`
          )
          console.warn(
            `Prepared 0 quiz questions for category ${category} even though ${allQuestions.length} were fetched.`
          )
          return
        }
        if (quizQuestions.length < 10 && allQuestions.length >= 10) {
          console.warn(
            `Only ${quizQuestions.length} questions selected for ${category}, though 10 were expected.`
          )
        } else if (quizQuestions.length < 10) {
          console.info(
            `Fewer than 10 questions (${quizQuestions.length}) available for category ${category}. Proceeding with available questions.`
          )
        }

        console.log(
          `Prepared ${quizQuestions.length} questions for the quiz:`,
          quizQuestions
        )

        // Store selected category, questions, and player name for quiz.html
        localStorage.setItem('selectedQuizCategory', category)
        localStorage.setItem('quizQuestions', JSON.stringify(quizQuestions))
        localStorage.setItem('playerName', playerName)

        // Redirect to the quiz page
        window.location.href = 'quiz.html'
      } else {
        console.error(
          `Failed to fetch questions for category "${category}":`,
          returnObject.message
        )
        alert(
          `Error loading questions: ${returnObject.message}. Please try again or select a different category.`
        )
      }
    } catch (error) {
      console.error(
        'Error during category selection and question fetching process:',
        error
      )
      alert(
        'An unexpected error occurred while preparing the quiz. Please check your connection and try again.'
      )
    }
  })
})
