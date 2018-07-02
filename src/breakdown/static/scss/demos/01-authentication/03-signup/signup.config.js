module.exports = {
  context: {
    buttonSubmitContext: {
      text: 'Sign Up',
      type: 'submit'
    },
    formDividerContext: {
      text: 'Or'
    },
    formFieldEmailContext: {
      id: 'email',
      label: 'Email',
      labelNote: false,
      inputText: {
        id: 'email',
        type: 'email'
      }
    },
    formFieldSocialContext: {
      label: 'Sign In With',
      labelElement: 'p',
      labelNote: false,
      inputAuthButtons: true,
      inputText: false,
    },
    titleContext: {
      id: 'heading-form',
      text: 'Sign Up',
      xSelector: 'l-auth-x-title'
    },
    textContext: {
      text: 'Already have an account? <a href="#">Log In</a>.',
      xSelector: 'l-auth-x-text'
    }
  },
  label: 'Sign Up'
};
