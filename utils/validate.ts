import regexHelper from './regexHelper.ts'

const validate:any = {
  registerInput: (email:string, password:string, passwordConfirm:string, username:string) => {
    const errors:any = {}

    if (username.trim() === '') {
      errors.username = 'Please enter a username.'
    }

    if (email.trim() === '') {
      errors.email = 'Please enter an email.'
    } else {
      if (!regexHelper.isValidEmail(email)) {
        errors.email = 'Please enter a valid email address.'
      }
    }

    if (password === '') {
      errors.password = 'Please enter a password.'
    } else if (password.length < 8) {
      errors.password = 'Please enter a password with 8 or more characters.'
    } else if (password !== passwordConfirm) {
      errors.password = 'Passwords do not match.'
    }

    return {
      errors,
      valid: !Object.keys(errors).length
    }
  },

  loginInput: (password:string, username:string) => {
    const errors:any = {}

    if (username.trim() === '') {
      errors.username = 'Please enter a username.'
    }

    if (password === '') {
      errors.password = 'Please enter a password.'
    }

    return {
      errors,
      valid: !Object.keys(errors).length
    }
  },
}

export default validate
