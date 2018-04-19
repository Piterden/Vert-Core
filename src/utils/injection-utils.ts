import 'reflect-metadata'

import { appConfig } from '../config/index'
import { autoInjector, globalInjector } from '../injection/data/internal-injectors'
import { injectableIndicator } from '../injection/injectable'
import { TConstructor, TProviders } from '../types/index'

abstract class InjectionUtils {
  /**
   * Check whether target is injectable.
   *
   * @param target
   * @return {boolean}
   */
  static checkInjectable (target: any): boolean {
    // Target must be signed with "$$isInjectable"
    if (!target[injectableIndicator]) {
      console.error(
        `[${appConfig.name}] Class "${target.name}" can't be injected because it is non-injectable. ` +
        `Please decorate it with "Service" before injection.`
      )
      return false
    }

    return true
  }

  /**
   * Create instance executing function.
   *
   * @param {TConstructor} Provider
   * @param {any[]} args
   * @return {any}
   */
  static createProviderInstance (Provider: TConstructor, args: any[] = []) {
    if (!InjectionUtils.checkInjectable(Provider)) {
      return
    }

    const instance = new Provider(...args)
    Object.defineProperty(instance, '$$providerName', {
      value: Provider.prototype.constructor.name
    })
    return instance
  }

  /**
   * Class a class that has already been injected.
   *
   * @param {*} targetClass
   * @param {TProviders} Providers
   * @return {*}
   */
  static createInjectedConstructor (targetClass: any, Providers: TProviders): any {
    // New constructor.
    const Constructor: any = function () {
      const providers = []

      for (const Provider of Providers) {
        if (!InjectionUtils.checkInjectable(Provider)) {
          providers.push(undefined)
          return
        }

        let instance = globalInjector.get(Provider) ||
          autoInjector.get(Provider)

        if (!instance) {
          instance = InjectionUtils.createProviderInstance(Provider)
          autoInjector.set(Provider, instance)
        }

        providers.push(instance)
      }

      return new targetClass(...providers)
    }

    Constructor.prototype = targetClass.prototype

    // Mark it injectable.
    InjectionUtils.setInjectable(Constructor)

    Object.defineProperty(Constructor, 'name', {
      writable: true,
      configurable: true,
      value: targetClass.name
    })

    return Constructor
  }

  /**
   * Mark a class injectable.
   *
   * @param target
   */
  static setInjectable (target: any) {
    Object.defineProperty(target, injectableIndicator, {
      configurable: false,
      value: true,
      writable: false
    })
  }
}

export {
  InjectionUtils
}