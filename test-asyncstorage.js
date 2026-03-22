// Test AsyncStorage functionality
// Run this with: npx expo start, then in console check logs

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function testAsyncStorage() {
    const TEST_KEY = 'trainer_saved_schedules';
    
    try {
        console.log('=== AsyncStorage Test ===');
        
        // Test 1: Write
        const testData = [{ id: 'test-1', name: 'Test Schedule', savedAt: new Date().toISOString() }];
        await AsyncStorage.setItem(TEST_KEY, JSON.stringify(testData));
        console.log('✅ Write successful');
        
        // Test 2: Read
        const retrieved = await AsyncStorage.getItem(TEST_KEY);
        console.log('✅ Read successful:', retrieved);
        
        // Test 3: Parse
        const parsed = JSON.parse(retrieved);
        console.log('✅ Parse successful:', parsed);
        
        // Test 4: Clean up
        await AsyncStorage.removeItem(TEST_KEY);
        console.log('✅ Cleanup successful');
        
        console.log('=== All tests passed ===');
        return true;
    } catch (error) {
        console.error('❌ AsyncStorage test failed:', error);
        return false;
    }
}
