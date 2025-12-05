import { customAlphabet } from 'nanoid'

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export const generateId = (length = 10) => {
  const nanoid = customAlphabet(alphabet, length)
  return nanoid()
}

export const generateSecretKey = () => {
  return generateId(32)
}
