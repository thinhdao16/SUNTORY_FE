import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonButton, IonItem, IonInput, IonIcon, IonChip, IonLabel } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chevronBackOutline, paperPlaneOutline, close } from 'ionicons/icons';
import { getInfo as getInfoService } from '@/services/auth/auth-service';
import { useHealthMasterDataStore } from '@/store/zustand/health-master-data-store';
import { useMenuTranslationStore } from '@/store/zustand/menuTranslationStore';

interface AllergyItem {
    allergyId: number;
    name: string;
}

const AllergiesSetup: React.FC = () => {
    const history = useHistory();
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [isIconSendStyle, setIsIconSendStyle] = useState('black');
    const [savedAllergies, setSavedAllergies] = useState<AllergyItem[]>([]);
    const [selectedAllergies, setSelectedAllergies] = useState<AllergyItem[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchResults, setSearchResults] = useState<AllergyItem[]>([]);
    const healthMasterData = useHealthMasterDataStore((state) => state.masterData);
    const { setSavedAllergiesStore, savedAllergiesStore: storeAllergies, setSelectedAllergiesStore, selectedAllergiesStore: storeSelectedAllergies, diet, setDiet } = useMenuTranslationStore();
    // Get all allergies from healthMasterData
    const getAllAllergies = (): AllergyItem[] => {
        if (!healthMasterData?.groupedAllergies) return [];

        const allAllergies: AllergyItem[] = [];
        healthMasterData.groupedAllergies.forEach((group: any) => {
            group.allergies.forEach((allergy: any) => {
                allAllergies.push({
                    allergyId: allergy.id,
                    name: allergy.name
                });
            });
        });
        return allAllergies;
    };

    useEffect(() => {
        (async () => {
            try {
                const res: any = await getInfoService();
                const fromProfile: AllergyItem[] = res.data.allergies.map((item: any) => ({
                    allergyId: item.allergy.id || item.id,
                    name: item.allergy.name
                }));
                const dietStyle: number = res.data.groupedLifestyles.find(
                    (g: any) => g.category?.name === "Diet"
                )?.lifestyles.map((item: any) => item.id);

                //set state
                setSavedAllergies(fromProfile);
                setSavedAllergiesStore(fromProfile);
                setDiet(dietStyle.toString());
            } catch {
                console.log("error");
            }
        })();
    }, []);

    // Khôi phục giá trị từ store khi quay lại
    useEffect(() => {
        if (storeAllergies.length > 0 && storeSelectedAllergies.length > 0) {
            setSavedAllergies(storeAllergies);
            setSelectedAllergies(storeSelectedAllergies);
        }
    }, [storeAllergies, storeSelectedAllergies, savedAllergies, selectedAllergies]);

    // Ẩn dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = () => {
            setShowDropdown(false);
        };

        if (showDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showDropdown]);

    // Function để search allergies
    const handleInputChange = (value: string) => {
        setInputValue(value);
        value ? setIsIconSendStyle('blue') : setIsIconSendStyle('black');

        if (value.trim().length > 0) {
            const allAllergies = getAllAllergies();
            // Filter allergies dựa trên input
            const filtered = allAllergies.filter(allergy =>
                allergy.name.toLowerCase().includes(value.toLowerCase()) &&
                !selectedAllergies.some(selected => selected.allergyId === allergy.allergyId) &&
                !savedAllergies.some(saved => saved.allergyId === allergy.allergyId)
            );
            setSearchResults(filtered.slice(0, 5)); // Giới hạn 5 kết quả
            setShowDropdown(filtered.length > 0);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    };

    // Function để chọn từ dropdown
    const selectFromDropdown = (allergyItem: AllergyItem) => {
        setSelectedAllergies(prev => [...prev, allergyItem]);
        setInputValue('');
        setShowDropdown(false);
        setSearchResults([]);
        setIsIconSendStyle('black');
    };

    const addAllergy = () => {
        const value = inputValue.trim();
        if (!value) return;
        if (selectedAllergies.some(allergy => allergy.name === value)) {
            setInputValue('');
            return;
        }
        const newAllergy: AllergyItem = {
            allergyId: 0, // id = 0 cho allergies mới
            name: value
        };
        setSelectedAllergies(prev => [...prev, newAllergy]);
        setInputValue('');
        setIsIconSendStyle('black');
    };

    const removeSavedAllergy = (name: string) => {
        const newSavedAllergies = savedAllergies.filter(x => x.name !== name);
        setSavedAllergies(newSavedAllergies);
        setSavedAllergiesStore(newSavedAllergies);
    };

    const removeSelectedAllergy = (name: string) => {
        const newSelectedAllergies = selectedAllergies.filter(x => x.name !== name);
        setSelectedAllergies(newSelectedAllergies);
        setSelectedAllergiesStore(newSelectedAllergies);
    };

    const handleContinue = () => {
        const allAllergies = [...selectedAllergies, ...savedAllergies];
        setSavedAllergiesStore(savedAllergies);
        setSelectedAllergiesStore(selectedAllergies);
        history.push('/menu-translation/diet-setup', { allergies: allAllergies });
    };

    return (
        <IonPage>
            <IonContent className="ion-padding" >
                <div className="relative flex flex-col">{/* reserve space for bottom buttons */}
                    {/* Progress */}
                    <div className="flex items-center gap-3 px-2 pt-2">
                        <div className="flex-1 h-2 rounded-full bg-blue-600" />
                        <div className="flex-1 h-2 rounded-full bg-blue-200" />
                    </div>

                    {/* Title */}
                    <h1 className="text-center text-xl font-semibold mt-6">{t('Enter your food allergies')}</h1>

                    {/* Input */}
                    <div className="px-2 mt-4 relative">
                        <IonItem lines="none" className="rounded-xl border border-neutral-200 shadow-sm" style={{ '--background': '#ffffff' } as any}>
                            <IonInput
                                value={inputValue}
                                placeholder={t('e.g., Peanuts, Shellfish')}
                                onIonChange={(e) => handleInputChange((e.detail.value ?? '').toString())}
                                onIonFocus={() => {
                                    if (inputValue.trim().length > 0 && searchResults.length > 0) {
                                        setShowDropdown(true);
                                    }
                                }}
                            />
                            <IonButton slot="end" fill="clear" onClick={addAllergy} aria-label="Add allergy">
                                <IonIcon icon={paperPlaneOutline} className="text-gray-500" style={{ color: isIconSendStyle }} />
                            </IonButton>
                        </IonItem>

                        {/* Dropdown Search Results */}
                        {showDropdown && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 mx-2 max-h-48 overflow-y-auto">
                                {searchResults.map((allergy) => (
                                    <div
                                        key={`dropdown-${allergy.allergyId}`}
                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                                        onClick={() => selectFromDropdown(allergy)}
                                    >
                                        <span className="text-gray-900 text-sm">{allergy.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Saved from profile */}
                    {savedAllergies.length > 0 && (
                        <div className="px-2 mt-6">
                            <p className="text-sm font-semibold text-black-700 mb-3">{t('Saved from your profile:')}</p>
                            <div className="flex flex-wrap gap-3">
                                {savedAllergies.map((allergy) => (
                                    <IonChip
                                        key={`saved-${allergy.allergyId}-${allergy.name}`}
                                        className="bg-blue-200"
                                        style={{
                                            'color': '#CFDCFD',
                                            'height': '37px',
                                            'width': '98px',
                                            'radius': '12',
                                            'align-items': 'center',
                                            backgroundColor: '#CFDCFD',
                                            borderRadius: '12px',
                                            padding: '0 10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <IonLabel
                                            className="text-sm text-blue-700"
                                            style={{
                                                color: "#000001",
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                minWidth: 0,
                                                flex: '1 1 auto'
                                            }}
                                        >
                                            {allergy.name}
                                        </IonLabel>
                                        <IonIcon
                                            icon={close}
                                            onClick={() => removeSavedAllergy(allergy.name)}
                                            style={{
                                                color: '#ef476f',
                                                marginLeft: 6,
                                                'align-items': 'center',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                width: '16px',
                                                height: '16px',
                                                fontSize: '16px'
                                            }}
                                        />
                                    </IonChip>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add new allergies */}
                    {(selectedAllergies.length > 0) && (
                        <div className="px-2 mt-6">
                            <p className="text-sm font-semibold text-black-700 mb-3">{t('Add new allergies:')}</p>
                            <div className="flex flex-wrap gap-3">
                                {selectedAllergies.map((allergy) => (
                                    <IonChip
                                        key={`new-${allergy.allergyId}-${allergy.name}`}
                                        className="bg-blue-200"
                                        style={{
                                            'color': '#CFDCFD',
                                            'height': '37px',
                                            'width': '98px',
                                            'radius': '12',
                                            'align-items': 'center',
                                            backgroundColor: '#CFDCFD',
                                            borderRadius: '12px',
                                            padding: '0 10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <IonLabel
                                            className="text-sm text-blue-700"
                                            style={{
                                                color: "#000001",
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                minWidth: 0,
                                                flex: '1 1 auto'
                                            }}
                                        >
                                            {allergy.name}
                                        </IonLabel>
                                        <IonIcon
                                            icon={close}
                                            onClick={() => removeSelectedAllergy(allergy.name)}
                                            style={{
                                                color: '#ef476f',
                                                marginLeft: 6,
                                                'align-items': 'center',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                width: '16px',
                                                height: '16px',
                                                fontSize: '16px'
                                            }}
                                        />
                                    </IonChip>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="fixed bottom-0 left-0 right-0">
                        {/* Bottom actions */}
                        <div className="absolute bottom-2 left-0 right-0 px-4 pb-8 bg-white flex items-center justify-between">
                            <IonButton
                                fill="clear"
                                onClick={() => history.push('/menu-translation')}
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    margin: 0
                                }}
                            >
                                <IonIcon
                                    icon={chevronBackOutline}
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '20px'
                                    }}
                                />
                            </IonButton>
                            <div className="flex-1 ml-4">
                                <IonButton expand="block" shape="round" onClick={() => handleContinue()} style={{
                                    background: '#1152F4',
                                    color: 'white',
                                    height: '44px',
                                    borderRadius: '16px',
                                    border: '100'
                                }}>
                                    {t('Continue')}
                                </IonButton>
                            </div>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AllergiesSetup;

{/* <IonButton
expand="block"
shape="round"
onClick={() => history.push("/camera")}
className="h-14"
style={{
    '--background': '#1152F4',
    '--background-hover': '#2563eb',
    '--color': 'white'
}}
>
{t('Take Photo')}
</IonButton> */}