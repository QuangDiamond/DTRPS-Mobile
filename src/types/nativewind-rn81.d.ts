
import 'react-native/Libraries/Components/View/ViewPropTypes';
import 'react-native/Libraries/Text/Text';

declare module 'react-native/Libraries/Components/View/ViewPropTypes' {
  interface ViewProps {
    className?: string;
  }
}

declare module 'react-native/Libraries/Text/Text' {
  interface TextProps {
    className?: string;
  }
}
