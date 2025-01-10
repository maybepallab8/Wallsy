import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useTheme } from '@/context/ThemeContext';
import { Sound } from './playercomponents/types';
import AddSoundButton from './playercomponents/AddSoundButton';
import Colors from '@/constants/Colors';
import SoundList from './playercomponents/SoundList';
import VolumeControls from './playercomponents/VolumeControls';
import PlayerControls from './playercomponents/PlayerControls';
import { Audio } from 'expo-av';

const SoundPlayer = () => {
    const theme = useTheme();
    const [selectedSounds, setSelectedSounds] = useState<Sound[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);

    const handleAddSound = async (newSound: Sound) => {
        setSelectedSounds(prevSounds => [...prevSounds, { ...newSound, rate: playbackRate }]);
    };

    const handleRemoveSound = async (id: string) => {
        const soundToRemove = selectedSounds.find((s) => s.id === id);
        if (soundToRemove?.sound) {
            await soundToRemove.sound.unloadAsync();
        }
        setSelectedSounds(selectedSounds.filter((s) => s.id !== id));
    };

    const handleVolumeChange = async (id: string, volume: number) => {
        setSelectedSounds(
            selectedSounds.map((sound) => {
                if (sound.id === id) {
                    if (sound.sound) {
                        sound.sound.setVolumeAsync(volume);
                    }
                    return { ...sound, volume };
                }
                return sound;
            })
        );
    };

    const handleSpeedChange = async (rate: number) => {
        setPlaybackRate(rate);
        for (const sound of selectedSounds) {
            if (sound.sound) {
                await sound.sound.setRateAsync(rate, true);
            }
        }
    };

    const handleTogglePlayback = async () => {
        const newIsPlaying = !isPlaying;
        setIsPlaying(newIsPlaying);

        for (const sound of selectedSounds) {
            if (sound.sound) {
                if (newIsPlaying) {
                    await sound.sound.setRateAsync(playbackRate, true);
                    await sound.sound.playAsync();
                } else {
                    await sound.sound.pauseAsync();
                }
            }
        }
    };

    const handleReset = async () => {
        setIsPlaying(false);
        for (const sound of selectedSounds) {
            if (sound.sound) {
                await sound.sound.stopAsync();
                await sound.sound.setPositionAsync(0);
            }
        }
    };

    useEffect(() => {
        interface PlaybackSubscription {
            remove: () => void;
        }
        const subscriptions: PlaybackSubscription[] = [];
        
        selectedSounds.forEach(sound => {
            if (sound.sound) {
                try {
                    const listener = async (status: { isLoaded: boolean; didJustFinish?: boolean; positionMillis?: number; durationMillis?: number }) => {
                        if (status.isLoaded) {
                            if (status.didJustFinish) {
                                const statusPromises = selectedSounds.map(async s => {
                                    if (!s.sound) return true;
                                    const soundStatus = await s.sound.getStatusAsync();
                                    return !soundStatus.isLoaded || 
                                           (soundStatus.isLoaded && 
                                            (soundStatus.didJustFinish || 
                                             soundStatus.positionMillis === soundStatus.durationMillis));
                                });
                                
                                const soundStatuses = await Promise.all(statusPromises);
                                const allSoundsFinished = soundStatuses.every(status => status);
                                
                                if (allSoundsFinished) {
                                    setIsPlaying(false);
                                    await handleReset();
                                }
                            }
                        }
                    };
                    
                    sound.sound.setOnPlaybackStatusUpdate(listener);
                    subscriptions.push({ remove: () => sound.sound?.setOnPlaybackStatusUpdate(null) });
                } catch (error) {
                    console.error('Error setting up playback listener:', error);
                }
            }
        });

        return () => {
            subscriptions.forEach(sub => {
                try {
                    sub.remove();
                } catch (error) {
                    console.error('Error removing subscription:', error);
                }
            });
        };
    }, [selectedSounds]);

    return (
        <View style={styles.mainContainer}>
            <View style={[styles.container, { backgroundColor: theme ? Colors.dark.background : Colors.light.background }]}>
                <ScrollView
                    style={styles.scrollContent}
                    contentContainerStyle={styles.scrollContentContainer}
                >
                    <AddSoundButton
                        onAddSound={handleAddSound}
                        isPlaying={isPlaying}
                        playbackRate={playbackRate}
                    />
                    <SoundList
                        sounds={selectedSounds}
                        onRemoveSound={handleRemoveSound}
                    />
                    <VolumeControls
                        sounds={selectedSounds}
                        onVolumeChange={handleVolumeChange}
                    />
                </ScrollView>
            </View>
            <PlayerControls
                isPlaying={isPlaying}
                hasSounds={selectedSounds.length > 0}
                onTogglePlayback={handleTogglePlayback}
                onReset={handleReset}
                playbackRate={playbackRate}
                onSpeedChange={handleSpeedChange}
            />
        </View>
    )
}

export default SoundPlayer

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
});