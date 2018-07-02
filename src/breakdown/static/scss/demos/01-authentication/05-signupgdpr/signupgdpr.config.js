module.exports = {
  context: {
    buttonSubmitContext: {
      text: 'Create Account',
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
      inputText: false
    },
    titleContext: {
      id: 'heading-form',
      text: 'Create a Badgr Account',
      xSelector: 'l-auth-x-title'
    },
    textContext: {
      text: 'Already have an account? <a href="#">Log In</a>.',
      xSelector: 'l-auth-x-text'
    }
  },
  label: 'Sign Up - GDPR'
};
