import { MissingCredentialsError, readCredentials } from '../src/auth.js'

describe('readCredentials', () => {
  it('returns trimmed credentials when both env vars set', () => {
    const env = { ILETIMERKEZI_API_KEY: '  abc  ', ILETIMERKEZI_API_HASH: ' xyz ' }
    expect(readCredentials(env)).toEqual({ key: 'abc', hash: 'xyz' })
  })

  it('throws MissingCredentialsError when key missing', () => {
    expect(() => readCredentials({ ILETIMERKEZI_API_HASH: 'xyz' })).toThrow(
      MissingCredentialsError,
    )
  })

  it('throws MissingCredentialsError when hash missing', () => {
    expect(() => readCredentials({ ILETIMERKEZI_API_KEY: 'abc' })).toThrow(
      MissingCredentialsError,
    )
  })

  it('throws when both empty strings', () => {
    expect(() =>
      readCredentials({ ILETIMERKEZI_API_KEY: '   ', ILETIMERKEZI_API_HASH: '' }),
    ).toThrow(MissingCredentialsError)
  })

  it('error message points to authentication doc and panel toggle', () => {
    try {
      readCredentials({})
    } catch (err) {
      expect(err).toBeInstanceOf(MissingCredentialsError)
      const message = (err as Error).message
      expect(message).toContain('ILETIMERKEZI_API_KEY')
      expect(message).toContain('Allow API access')
      expect(message).toContain('https://www.iletimerkezi.com/docs/api/authentication')
    }
  })
})
