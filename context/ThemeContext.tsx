import { StyleSheet, Text, View } from 'react-native'
import React, { useState, ReactNode } from 'react'
import { useContext, createContext } from 'react'

const ThemeContext = React.createContext<boolean>(false);
const ThemeUpdateContext = React.createContext<() => void>(() => {});

type ThemeProviderProps = {
  children: ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [darkTheme, setDarkTheme] = useState(false);
  const toggleTheme = () => {
    setDarkTheme(darkTheme => !darkTheme);
  }
  return (
    <ThemeContext.Provider value={darkTheme}>
      <ThemeUpdateContext.Provider value={toggleTheme}>
        {children}
      </ThemeUpdateContext.Provider>
    </ThemeContext.Provider>
  )
}

export default ThemeProvider;

export const useTheme = () => useContext(ThemeContext);
export const useUpdateTheme = () => useContext(ThemeUpdateContext);


const styles = StyleSheet.create({})