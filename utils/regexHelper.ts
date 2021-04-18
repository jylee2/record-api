const emailRegex:any = new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)

const regexHelper:any = {
  isValidEmail: (email:string) => {
    return email.match(emailRegex)
  }
}

export default regexHelper
