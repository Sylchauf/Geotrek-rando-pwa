import { Platform } from 'react-native'
import { PERMISSIONS, requestMultiple } from 'react-native-permissions'

const askPermission = async () => {
  if (Platform.OS === 'android') {
    await requestMultiple([PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION])
  } else {
    await requestMultiple([PERMISSIONS.IOS.LOCATION_WHEN_IN_USE])
  }
}

export default askPermission
