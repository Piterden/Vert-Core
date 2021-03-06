import { TProviders } from '../types'
import { InjectionUtils } from '../utils/injection-utils'
import { ReflectionUtils } from '../utils/reflection-utils'

/**
 * Standalone injector class.
 */
class Injector {
  /**
   * Create a new class injector.
   *
   * @param {TProviders} Providers
   * @return {Injector}
   */
  static create (...Providers: TProviders): Injector {
    return new Injector(...Providers)
  }

  /**
   * Provider storage.
   */
  private map = new WeakMap()

  /**
   * Get target instance from injector by providing provider.
   *
   * @param {{new(...args): T}} Provider
   * @return {T}
   */
  get <T> (Provider: new (...args) => T): T {
    return this.map.get(Provider)
  }

  /**
   * Whether it holds target provider.
   *
   * @param Provider
   * @return {boolean}
   */
  has (Provider: any): boolean {
    return this.map.has(Provider)
  }

  /**
   * Set a provider instance to cache,
   *
   * @param {{new(...args): T}} Provider
   * @param {T} instance
   */
  set <T> (Provider: new (...args) => T, instance: T) {
    if (!this.has(Provider)) {
      this.map.set(Provider, instance)
    }
  }

  constructor (...Providers: TProviders) {
    for (const Provider of Providers) {
      const dependencies = ReflectionUtils.getProvidersFromParams(Provider)
        .map(Dependency => {
          let provider = this.get(Dependency)
          if (!provider) {
            provider = InjectionUtils.createProviderInstance(Dependency)
            this.set(Dependency, provider)
          }
          return provider
        })
      const provider = InjectionUtils.createProviderInstance(Provider, dependencies)
      this.set(Provider, provider)
    }
  }
}

export {
  Injector
}
