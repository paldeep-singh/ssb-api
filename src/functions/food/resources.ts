import { IECSCluster, IECSService } from '@libs/ecs'

const FoodDatabaseService: IECSService = {
  DesiredCount: 1,
  LaunchType: 'FARGATE'
}

const FoodDatabaseTaskDefinition: IECSService = {
  LaunchType: 'FARGATE'
}

const resources = {
  FoodDatabaseResource: FoodDatabaseService
}

export default resources
