import { AwsStrings, Tag } from './misc-aws-utils'

type EBS = {
  DeleteOnTermination?: boolean
  Encrypted?: boolean
  Iops?: number
  KmsKeyId?: AwsStrings
  SnapshotId?: string
  VolumeSize?: number
  VolumeType?: string
}

type LaunchTemplate =
  | {
      LaunchTemplateId: string
      Version: string
    }
  | {
      LaunchTemplateName: string
      Version: string
    }

type NetworkInterface = {
  AssociatePublicIpAddress?: boolean
  AssociateCarrierIpAddress?: boolean
  DeleteOnTermination?: boolean
  DeviceIndex?: string
  Description?: string
  GroupSet?: string[]
  Ipv6AddressCount?: number
  Ipv6Addresses?: {
    Ipv6Address: string
  }[]
  NetworkInterfaceId?: string
  PrivateIpAddress?: string
  PrivateIpAddresses?: {
    Primary: boolean
    PrivateIpAddress: string
  }
  SecondaryPrivateIpAddressCount?: number
  SubnetId?: string
}

export type IEC2Instance = {
  Type: 'AWS::EC2::Instance'
  Properties: {
    AdditionalInfo?: string
    Affinity?: string
    AvailabilityZone?: string
    BlockDeviceMappings?: {
      DeviceName?: string
      Ebs?: EBS
      NoDevice?: string
      VirtualName?: string
    }
    CpuOptions?: {
      CoreCount?: number
      ThreadsPerCore?: number
    }
    CreditSpecification?: {
      CPUCredits?: 'standard' | 'unlimited'
    }
    EbsOptimized?: boolean
    ElasticGpuSpecifications?: {
      Type?: string
    }
    ElasticInferenceAccelerators?: {
      Count?: number
      Type?:
        | 'eia1.medium'
        | 'eia1.large'
        | 'eia1.xlarge'
        | 'eia2.medium'
        | 'eia2.large'
        | 'eia2.xlarge'
    }
    EnclaveOptions?: {
      Enabled?: boolean
    }
    HibernationOptions?: {
      Configured?: boolean
    }
    HostId?: string
    HostResourceGroupArn?: AwsStrings
    IamInstanceProfile?: string
    ImageId?: string
    InstanceInitiatedShutdownBehavior?: 'stop' | 'terminate'
    InstanceType?: string
    Ipv6AddressCount?: number
    Ipv6Addresses?: {
      Ipv6Address: string
    }[]
    KernelId?: string
    KeyName?: string
    LaunchTemplate?: LaunchTemplate
    LicenseSpecifications?: {
      LicenseConfigurationArn?: AwsStrings
    }
    Monitoring?: boolean
    NetworkInterfaces?: NetworkInterface
    PlacementGroupName?: string
    PrivateDnsNameOptions?: {
      EnabledResourceNameDnsAAAARecord?: boolean
      EnableResourceNameDnsARecord?: boolean
      HostnameType: 'ip-name' | 'resource-name'
    }
    PrivateIpAddress?: string
    PropagateTagsToVolumeOnCreation: boolean
    RamdiskId?: string
    SecurityGroupIds?: string[]
    SecurityGroups?: string[]
    SourceDestCheck?: boolean
    SsmAssociations?: {
      AssociationParameters?: {
        Key: string
        Value: string[]
      }
      DocumentName: string
    }
    SubnetId?: string
    Tags?: Tag[]
    Tenancy?: 'default' | 'dedicated' | 'host'
    UserData?: string
    Volumes?: {
      Device: string
      VolumeId: string
    }
  }
}
