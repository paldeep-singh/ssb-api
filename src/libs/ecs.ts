import { AwsStrings, Tag } from './misc-aws-utils'

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

type ISecret = {
  Name: string
  ValueFrom: string
}

type LogConfiguration = {
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
  SecretOptions?: ISecret[]
}
type ServiceConnectConfiguration = {
  Enabled: boolean
  LogConfiguration: LogConfiguration
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

type ExecuteCommandLogConfiguration = {
  CloudWatchEncryptionEnabled?: boolean
  CloudWatchLogGroupName?: string
  S3BucketName?: string
  S3EncryptionEnabled?: boolean
  S3KeyPrefix?: string
}

type Add =
  | 'ALL'
  | 'AUDIT_CONTROL'
  | 'AUDIT_WRITE'
  | 'BLOCK_SUSPEND'
  | 'CHOWN'
  | 'DAC_OVERRIDE'
  | 'DAC_READ_SEARCH'
  | 'FOWNER'
  | 'FSETID'
  | 'IPC_LOCK'
  | 'IPC_OWNER'
  | 'KILL'
  | 'LEASE'
  | 'LINUX_IMMUTABLE'
  | 'MAC_ADMIN'
  | 'MAC_OVERRIDE'
  | 'MKNOD'
  | 'NET_ADMIN'
  | 'NET_BIND_SERVICE'
  | 'NET_BROADCAST'
  | 'NET_RAW'
  | 'SETFCAP'
  | 'SETGID'
  | 'SETPCAP'
  | 'SETUID'
  | 'SYS_ADMIN'
  | 'SYS_BOOT'
  | 'SYS_CHROOT'
  | 'SYS_MODULE'
  | 'SYS_NICE'
  | 'SYS_PACCT'
  | 'SYS_PTRACE'
  | 'SYS_RAWIO'
  | 'SYS_RESOURCE'
  | 'SYS_TIME'
  | 'SYS_TTY_CONFIG'
  | 'SYSLOG'
  | 'WAKE_ALARM'

type Drop =
  | 'ALL'
  | 'AUDIT_CONTROL'
  | 'AUDIT_WRITE'
  | 'BLOCK_SUSPEND'
  | 'CHOWN'
  | 'DAC_OVERRIDE'
  | 'DAC_READ_SEARCH'
  | 'FOWNER'
  | 'FSETID'
  | 'IPC_LOCK'
  | 'IPC_OWNER'
  | 'KILL'
  | 'LEASE'
  | 'LINUX_IMMUTABLE'
  | 'MAC_ADMIN'
  | 'MAC_OVERRIDE'
  | 'MKNOD'
  | 'NET_ADMIN'
  | 'NET_BIND_SERVICE'
  | 'NET_BROADCAST'
  | 'NET_RAW'
  | 'SETFCAP'
  | 'SETGID'
  | 'SETPCAP'
  | 'SETUID'
  | 'SYS_ADMIN'
  | 'SYS_BOOT'
  | 'SYS_CHROOT'
  | 'SYS_MODULE'
  | 'SYS_NICE'
  | 'SYS_PACCT'
  | 'SYS_PTRACE'
  | 'SYS_RAWIO'
  | 'SYS_RESOURCE'
  | 'SYS_TIME'
  | 'SYS_TTY_CONFIG'
  | 'SYSLOG'
  | 'WAKE_ALARM'

type MountOptions =
  | 'defaults'
  | 'ro'
  | 'rw'
  | 'suid'
  | 'nosuid'
  | 'dev'
  | 'nodev'
  | 'exec'
  | 'noexec'
  | 'sync'
  | 'async'
  | 'dirsync'
  | 'remount'
  | 'mand'
  | 'nomand'
  | 'atime'
  | 'noatime'
  | 'diratime'
  | 'nodiratime'
  | 'bind'
  | 'rbind'
  | 'unbindable'
  | 'runbindable'
  | 'private'
  | 'rprivate'
  | 'shared'
  | 'rshared'
  | 'slave'
  | 'rslave'
  | 'relatime'
  | 'norelatime'
  | 'strictatime'
  | 'nostrictatime'
  | 'mode'
  | 'uid'
  | 'gid'
  | 'nr_inodes'
  | 'nr_blocks'
  | 'mpol'
export interface IECSService {
  Type: 'AWS::ECS::Service'
  Properties: {
    CapacityProviderStrategy?: CapacityProviderStrategy[]
    Cluster?: string
    DeploymentConfiguration?: DeploymentConfiguration
    DeploymentController?: {
      Type: 'ECS' | 'CODE_DEPLOY' | 'EXTERNAL'
    }
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
}

export type IECSCluster = {
  Type: 'AWS::ECS::Cluster'
  Properties: {
    CapacityProviders?: string[]
    ClusterName: string
    ClusterSettings?: {
      Name: string
      Value: string
    }
    Configuration?: {
      ExecuteCommandConfiguration?: {
        KmsKeyId?: string
        LogConfiguration?: ExecuteCommandLogConfiguration
        Logging?: 'DEFAULT' | 'OVERRIDE' | 'NONE'
      }
    }
    DefaultCapacityProviderStrategy?: CapacityProviderStrategy[]
  }
}

type IContainerDefinition = {
  Command?: string[]
  Cpu?: number
  DependsOn?: {
    Condition?: 'START' | 'COMPLETE' | 'SUCCESS' | 'HEALTHY'
    ContainerName: string
  }
  DisableNetworking?: boolean
  DnsSearchDomains?: string[]
  DnsServers?: string[]
  DockerLabels?: Record<string, string>
  DockerSecurityOptions?: string[]
  EntryPoint?: string[]
  Environment?: Record<string, string>
  EnvironmentFiles?: {
    Type: 's3'
    Value: string
  }
  Essential?: boolean
  ExtraHosts?: {
    Hostname: string
    IpAddress: string
  }
  FirelensConfiguration?: {
    Options?: Record<string, string>
    Type: 'fluentbit' | 'fluentd'
  }
  HealthCheck?: {
    Command: string[]
    Interval?: number
    Retries?: number
    StartPeriod?: number
    Timeout?: number
  }
  Hostname?: string
  Image: string
  Interactive?: boolean
  Links?: string[]
  LinuxParameters?: {
    Capabilities?: {
      Add?: Add[]
      Drop?: Drop[]
    }
    Devices?: {
      ContainerPath: string
      HostPath: string
      Permissions: string[]
    }
    InitProcessEnabled?: boolean
    MaxSwap?: number
    SharedMemorySize?: number
    Swappiness?: number
    Tmpfs?: {
      ContainerPath: string
      MountOptions?: MountOptions[]
      Size: number
    }
  }
  LogConfiguration?: LogConfiguration
  Memory?: number
  MemoryReservation?: number
  MountPoints?: {
    ContainerPath: string
    ReadOnly?: boolean
    SourceVolume: string
  }
  Name: string
  PortMapping?: {
    AppProtocol?: 'grpc' | 'http' | 'http2'
    ContainerPort: number
    ContainerPortRange?: string
    HostPort?: number
    Name?: string
    Protocol?: 'tcp' | 'udp'
  }[]
  Priveleged?: boolean
  PseudoTerminal?: boolean
  ReadonlyRootFilesystem?: boolean
  RepositoryCredentials?: {
    CredentialsParameter: string
  }
  ResourceRequirements?: {
    Type: 'GPU' | 'InferenceAccelerator'
    Value: string
  }
  Secrets?: ISecret[]
  StartTimeout?: number
  StopTimeout?: number
  SystemControls?: {
    Namespace: string
    Value: string
  }
  Ulimits?: {
    HardLimit: number
    Name: string
    SoftLimit: number
  }[]
  User: string
  VolumesFrom?: {
    ReadOnly?: boolean
    SourceContainer: string
  }[]
  WorkingDirectory?: string
}

type IProxyConfigurationProperties = {
  IgnoredUID: number | null
  IgnoredGID: number | null
  AppPorts: number[]
  ProxyEgressPort: number
  ProxyIngressPort: number
  EgressIgnoredPorts: number[]
  EgressIgnoredIPs: string[]
}

export type IECSTaskDefinition = {
  Type: 'AWS::ECS::TaskDefinition'
  Properties: {
    ContainerDefinitions: IContainerDefinition[]
    Cpu?: string
    EphemeralStorage?: {
      SizeInGiB: number
    }
    ExecutionRoleArn?: string
    Family?: string
    InferenceAccelerators?: {
      DeviceName: string
      DeviceType: string
    }
    IpcMode?: 'host' | 'task' | 'none'
    Memory?: string
    NetworkMode?: 'bridge' | 'host' | 'awsvpc' | 'none'
    PidMode?: 'host' | 'task'
    PlacementConstraints?: {
      Expression?: string
      Type: 'memberOf'
    }
    ProxyConfiguration?: {
      ContainerName?: string
      ProxyConfigurationProperties: IProxyConfigurationProperties
      Type: 'APPMESH'
    }
    RequiresCompatibilities?: ('EC2' | 'FARGATE')[]
    RuntimePlatform?: {
      CpuArchitecture?: 'ARM64' | 'X86_64'
      OperatingSystemFamily?: 'LINUX'
    }
    Tags?: Tag[]
    TaskRoleArn?: AwsStrings
    Volumes?: {
      DockerVolumeConfiguration?: {
        Autoprovision?: boolean
        Driver?: string
        DriverOpts?: Record<string, string>
        Labels?: Record<string, string>
        Scope?: 'task' | 'shared'
      }
      EFSVolumeConfiguration?: {
        AuthorizationConfig?: {
          AccessPointId?: string
          Iam?: 'ENABLED' | 'DISABLED'
        }
        FilesystemId: string
        RootDirectory?: string
        TransitEncryption?: 'ENABLED' | 'DISABLED'
        TransitEncryptionPort?: number
      }
      Host?: {
        SourcePath?: string
      }
      Name?: string
    }
  }
}
