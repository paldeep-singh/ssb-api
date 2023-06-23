import { Tag } from './misc-aws-utils'

type CapacityProviderStrategy = {
  Base: number
  Weight: number
  CapacityProvider: string
}

type DeploymentConfiguration = {
  MaximumPercent?: number
  MinimumHealthyPercent?: number
  DeploymentCircuitBreaker?: {
    Enable: boolean
    Rollback: boolean
  }
  Alarms: {
    AlarmName: string[]
    Enable: boolean
    Rollback: boolean
  }
}

type ServiceConnectConfiguration = {
  Enabled: boolean
  LogConfiguration: {
    LogDriver?:
      | 'awsfirelens'
      | 'awslogs'
      | 'fluentd'
      | 'splunk'
      | 'gelf'
      | 'json-file'
      | 'journald'
      | 'syslog'
    Options?: Record<string, string>
    SecretOptions?: {
      Name: string
      ValueFrom: string
    }[]
  }
  Namespace: string
  Services: {
    ClientAliases?: {
      DnsName: string
      Port: number
    }
    DiscoveryName?: string
    IngressPortOverride?: number
    PortName: string
  }
}

export interface IECSService {
  CapacityProviderStrategy?: CapacityProviderStrategy[]
  Cluster?: string
  DeploymentConfiguration?: DeploymentConfiguration
  DesiredCount?: number
  EnableECSManagedTags?: boolean
  EnableExecuteCommand?: boolean
  HealthCheckGracePeriodSeconds?: number
  LaunchType?: 'EC2' | 'FARGATE' | 'EXTERNAL'
  LoadBalancers?: {
    ContainerName: string
    ContainerPort: number
    LoadBalancerName: string
    TargetGroupArn: string
  }
  NetworkConfiguration?: {
    AwsvpcConfiguration: {
      AssignPublicIp?: 'ENABLED' | 'DISABLED'
      SecurityGroups?: string[]
      Subnets: string[]
    }
  }
  PlacementConstraints?: {
    Expression?: string
    Type: 'memberOf' | 'distinctInstance'
  }
  PlacementStrategies?: {
    Field?: string
    Type: 'random' | 'spread' | 'binpack'
  }[]
  PlatformVersion?: string
  PropagateTags?: 'TASK_DEFINITION' | 'SERVICE' | 'NONE'
  Role?: string
  SchedulingStrategy?: 'REPLICA' | 'DAEMON'
  ServiceConnectConfiguration?: ServiceConnectConfiguration
  ServiceName?: string
  Tags?: Tag[]
}
