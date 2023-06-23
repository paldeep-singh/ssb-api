import { IECSCluster, IECSService } from '@libs/ecs'

const FoodDatabaseResource: IECSService = {
  DesiredCount: 1,
  LaunchType: 'FARGATE'
}

const resources = {
  FoodDatabaseResource
}

export default resources
