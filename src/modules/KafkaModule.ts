import { DynamicModule } from '@nestjs/common';
import {
  DiscoveryModule,
  DiscoveryService,
  ModuleRef,
  Reflector
} from '@nestjs/core';

import { KafkaProvider } from '@lexitech/kafka/providers/KafkaProvider';

export class KafkaModule {
  public static forRoot(config: {
    host: string;
    port: number;
    username: string;
    password: string;
    securityProtocol: 'plaintext' | 'ssl' | 'sasl_plaintext' | 'sasl_ssl';
    mechanism: 'GSSAPI' | 'PLAIN' | 'SCRAM-SHA-256' | 'SCRAM-SHA-512' | 'OAUTHBEARER';
    groupId: string;
  }): DynamicModule {
    return {
      global: true,
      module: KafkaModule,
      imports: [DiscoveryModule],
      providers: [
        DiscoveryService, 
        Reflector,
        {
          provide: 'KafkaProvider',
          useFactory: (discoveryService: DiscoveryService, reflector: Reflector) => {
            const provider = new KafkaProvider(config.host, config.port, config.username, config.password, config.securityProtocol, config.mechanism, config.groupId);
            
            Object.defineProperty(provider, 'discoveryService', { value: discoveryService });
            Object.defineProperty(provider, 'reflector', { value: reflector });
            
            return provider;
          },
          inject: [DiscoveryService, Reflector]
        }
      ],
      exports: [ 'KafkaProvider' ]
    };
  }

  public static subscribe(...topics: string[]): DynamicModule {
    const KafkaSubscriber = {
      provide: 'KafkaSubscriber',
      useFactory: (kafkaProvider: KafkaProvider, discoveryService: DiscoveryService, reflector: Reflector, moduleRef: ModuleRef) => {
        Object.defineProperty(kafkaProvider, 'discoveryService', { value: discoveryService });
        Object.defineProperty(kafkaProvider, 'reflector', { value: reflector });
        Object.defineProperty(kafkaProvider, 'moduleRef', { value: moduleRef });

        return kafkaProvider.subscribe(...topics);
      },
      inject: [ 'KafkaProvider', DiscoveryService, Reflector, ModuleRef ]
    };

    return {
      global: true,
      module: KafkaModule,
      imports: [ DiscoveryModule, KafkaModule ],
      providers: [ DiscoveryService, Reflector, KafkaSubscriber ],
      exports: []
    };
  }
}
