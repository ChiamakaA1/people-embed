// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const DATA_FILE_PATH = 'data/Project_Harmony_People_Page_Information_Form.json';
    const IMAGE_BASE_PATH = 'images/Photo Directory/'; // Updated path to images

    // Workstream details - mapping internal keys to display names and ensuring correct order
    const WORKSTREAMS_CONFIG = [
        { key: "Procure to Pay (P2P)", displayName: "Procure to Pay (P2P)" },
        { key: "Master Data Management (MDM)", displayName: "Master Data Management (MDM)" },
        { key: "Order to Cash (O2C)", displayName: "Order to Cash (O2C)" },
        { key: "Record to Report (R2R)", displayName: "Record to Report (R2R)" },
        { key: "Supply Chain Management (SCM)", displayName: "Supply Chain Management (SCM)" },
        { key: "Hydrocarbon Accounting (HCA)", displayName: "Hydrocarbon Accounting (HCA)" }
    ];

    // --- DOM ELEMENT REFERENCES ---
    const tabNavigationContainer = document.querySelector('.tab-navigation');
    const teamContentArea = document.getElementById('team-content-area');
    const modal = document.getElementById('person-modal');
    const modalCloseButton = document.querySelector('.modal-close-button');
    const modalDetailsContainer = document.getElementById('modal-details');

    let allTeamMembers = []; // To store all fetched team members

    /**
     * Generates a simple UUID.
     * @returns {string} A UUID string.
     */
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    // Expose allTeamMembers and a refresh function for admin script
    const localStorageKey = 'teamDirectoryData'; // Define once, use in fetch and save

    window.teamDataManager = {
        getMembers: () => allTeamMembers,
        setMembers: (newMembers) => { // Used if we were to load data externally after initial load
            allTeamMembers = newMembers.map(member => ({ ...member, _id: member._id || generateUUID() }));
            this.saveDataToLocalStorage(); // `this` might be tricky here, better to call directly
            // window.teamDataManager.saveDataToLocalStorage(); // Safer
        },
        saveDataToLocalStorage: () => {
            try {
                localStorage.setItem(localStorageKey, JSON.stringify(allTeamMembers));
                console.log("Team data saved to Local Storage.");
            } catch (e) {
                console.error("Error saving data to Local Storage:", e);
                // Handle potential storage full errors, etc.
                alert("Could not save changes to local storage. Storage might be full or an error occurred.");
            }
        },
        refreshView: () => {
            const activeTabButton = document.querySelector('.tab-button.active');
            if (activeTabButton && activeTabButton.dataset.workstream) {
                displayWorkstream(activeTabButton.dataset.workstream);
            } else if (WORKSTREAMS_CONFIG.length > 0) {
                displayWorkstream(WORKSTREAMS_CONFIG[0].key); // Fallback to first workstream
            }
        },
        findMemberById: (id) => {
            console.log("[teamDataManager] findMemberById searching for ID:", id);
            const foundMember = allTeamMembers.find(member => member._id === id);
            console.log("[teamDataManager] findMemberById result:", foundMember);
            return foundMember;
        },
        // updateMember now takes id and the new data object
        updateMember: (id, updatedMemberData) => {
            const index = allTeamMembers.findIndex(member => member._id === id);
            if (index !== -1) {
                // Preserve the original _id, update the rest
                allTeamMembers[index] = { ...allTeamMembers[index], ...updatedMemberData, _id: id };
                window.teamDataManager.saveDataToLocalStorage(); // Save after update
                return true;
            }
            return false;
        },
        addMember: (newMemberData) => {
            // Assign a new ID when adding
            const newMemberWithId = { ...newMemberData, _id: generateUUID() };
            allTeamMembers.push(newMemberWithId);
            window.teamDataManager.saveDataToLocalStorage(); // Save after add
            return true;
        },
        deleteMemberById: (id) => {
            const initialLength = allTeamMembers.length;
            allTeamMembers = allTeamMembers.filter(member => member._id !== id);
            const success = allTeamMembers.length < initialLength;
            if (success) {
                window.teamDataManager.saveDataToLocalStorage(); // Save after delete
            }
            return success;
        }
    };

    // --- DATA FETCHING AND PROCESSING ---

    /**
     * Fetches and parses the team data from the RTF/JSON file.
     * This function now attempts to strip RTF formatting to get to the JSON.
     */
    async function fetchTeamData() {
        if (window.TEAM_DATA && Array.isArray(window.TEAM_DATA)) {
            allTeamMembers = window.TEAM_DATA.map(member => ({
                ...member,
                _id: member._id || generateUUID()
            }));
            return allTeamMembers;
        } else {
            throw new Error("TEAM_DATA not found. Make sure team_data.js is loaded before this script.");
        }
    }


    // --- DYNAMIC CONTENT GENERATION ---

    /**
     * Creates the navigation tabs for each workstream.
     */
    function createTabs() {
        if (!tabNavigationContainer) {
            console.error("Tab navigation container not found!");
            return;
        }
        WORKSTREAMS_CONFIG.forEach((ws, index) => {
            const button = document.createElement('button');
            button.classList.add('tab-button');
            button.dataset.workstream = ws.key; // Use the key for filtering
            button.textContent = ws.displayName; // Use displayName for the button text
            if (index === 0) {
                button.classList.add('active'); // Make the first tab active by default
            }
            button.addEventListener('click', () => {
                // Handle tab switching
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                displayWorkstream(ws.key);
            });
            tabNavigationContainer.appendChild(button);
        });
    }

    /**
     * Displays the team members for the selected workstream.
     * @param {string} workstreamKey - The key of the workstream to display.
     */
    function displayWorkstream(workstreamKey) {
        if (!teamContentArea) {
            console.error("Team content area not found!");
            return;
        }
        teamContentArea.innerHTML = ''; // Clear previous content

        const workstreamConfig = WORKSTREAMS_CONFIG.find(ws => ws.key === workstreamKey);
        if (!workstreamConfig) {
            console.error(`Workstream configuration not found for key: ${workstreamKey}`);
            return;
        }
        const workstreamDisplayName = workstreamConfig.displayName;

        const section = document.createElement('section');
        section.classList.add('workstream-section');
        section.id = `workstream-${workstreamKey.replace(/[^a-zA-Z0-9]/g, '-')}`; // Create a unique ID

        const header = document.createElement('h2');
        header.classList.add('workstream-header');
        header.textContent = workstreamDisplayName;
        section.appendChild(header);

        const subHeader = document.createElement('p');
        subHeader.classList.add('workstream-subheader');
        subHeader.textContent = "Let us introduce you to the team";
        section.appendChild(subHeader);

        const teamContainer = document.createElement('div');
        teamContainer.classList.add('team-container');

        const members = allTeamMembers.filter(member => member.Workstream === workstreamKey);
        const leads = members.filter(member => member.Role && member.Role.toUpperCase().includes('LEAD'));
        const nonLeads = members.filter(member => !member.Role || !member.Role.toUpperCase().includes('LEAD'));

        // Display leads first
        leads.forEach(member => {
            try {
                const tile = createPersonTile(member, true);
                if (tile) teamContainer.appendChild(tile); // Only append if tile creation was successful
            } catch (error) {
                console.error(`Error creating tile for lead ${member.Name || 'Unnamed'}:`, error);
                // Optionally, display a small error message tile or skip this member
            }
        });

        // Display other team members
        nonLeads.forEach(member => {
            try {
                const tile = createPersonTile(member, false);
                if (tile) teamContainer.appendChild(tile); // Only append if tile creation was successful
            } catch (error) {
                console.error(`Error creating tile for member ${member.Name || 'Unnamed'}:`, error);
                // Optionally, display a small error message tile or skip this member
            }
        });

        section.appendChild(teamContainer);
        teamContentArea.appendChild(section);
    }

    /**
     * Creates a tile for a single team member.
     * @param {object} member - The team member's data.
     * @param {boolean} isLead - True if the member is a Tower Lead.
     * @returns {HTMLElement} The created tile element.
     */
    function createPersonTile(member, isLead) {
        const tile = document.createElement('div');
        tile.classList.add('person-tile');
        if (isLead) {
            tile.classList.add('tower-lead');
        }

        // Image or Placeholder
        const imageContainer = document.createElement('div');
        const img = document.createElement('img');
        const imageName = member.Name ? member.Name.toLowerCase().replace(/\s+/g, '_') + '.jpg' : 'default.jpg'; // Guess image name
        img.src = IMAGE_BASE_PATH + (member.PhotoFile || imageName); // Use PhotoFile if available, else guess
        img.alt = member.Name || 'Team Member';

        const placeholder = document.createElement('div');
        placeholder.classList.add('image-placeholder');
        placeholder.textContent = getInitials(member.Name || 'TM'); // 'TM' for Team Member if no name

        img.onerror = () => {
            // console.warn(`Image not found for ${member.Name}: ${img.src}. Displaying placeholder.`);
            // Note for manual update:
            // To update image for [${member.Name}], ensure '${member.PhotoFile || imageName}' exists in '${IMAGE_BASE_PATH}'
            // or update 'PhotoFile' in the JSON data for this person.
            imageContainer.innerHTML = ''; // Clear the broken img
            imageContainer.appendChild(placeholder);
        };
        imageContainer.appendChild(img);
        tile.appendChild(imageContainer);


        // Name
        const nameElement = document.createElement('h3');
        nameElement.classList.add('name');
        nameElement.textContent = member.Name || 'N/A';
        tile.appendChild(nameElement);

        // Role
        const roleElement = document.createElement('p');
        roleElement.classList.add('role');
        roleElement.textContent = member.Role || 'N/A';
        tile.appendChild(roleElement);

        // Hover Information
        const hoverInfo = document.createElement('div');
        hoverInfo.classList.add('hover-info');
        hoverInfo.innerHTML = `
            <p><strong>Location:</strong> ${member.Location || 'N/A'}</p>
            <p><strong>Org Role:</strong> ${member['Role in the Parkland Org Chart'] || member.Role || 'N/A'}</p>
            <p><strong>Bio:</strong> ${member.Bio || 'N/A'}</p>
            <p><strong>Ways of Working:</strong> ${member['Working Style'] || member['Preferred Ways of Working'] || 'N/A'}</p>
            <p><strong>Fun Fact:</strong> ${member['Fun Fact'] || member['Fun Fact / Hobby'] || 'N/A'}</p>
        `;
        // Note: The keys like 'Role in the Parkland Org Chart' and 'Preferred Ways of Working'
        // are based on the requirements. Adjust if the JSON keys are different.
        // The current JSON uses "Working Style" and "Fun Fact".
        tile.appendChild(hoverInfo);

        // Admin Edit/Remove Buttons (conditionally displayed by CSS via body.admin-mode-on)
        const adminButtonsDiv = document.createElement('div');
        adminButtonsDiv.classList.add('tile-admin-buttons');

        const editButton = document.createElement('button');
        editButton.classList.add('edit-person-btn');
        editButton.textContent = 'Edit';
        editButton.dataset.memberId = member._id; // Store the unique ID
        editButton.onclick = (event) => {
            event.stopPropagation(); // Prevent tile click (modal opening)
            console.log("[populate_team.js] Edit button clicked for member _id:", member._id); // Log ID here
            
            const memberData = window.teamDataManager.findMemberById(member._id);
            console.log("[populate_team.js] memberData found by findMemberById:", memberData); // Log the result
            if (memberData && window.adminFormManager && typeof window.adminFormManager.populateAndShowForm === 'function') {
                window.adminFormManager.populateAndShowForm(memberData);
            } else {
                console.error("Could not find member data or admin form manager to edit (ID):", member._id);
                alert("Error: Could not initiate edit for this member.");
            }
        };
        adminButtonsDiv.appendChild(editButton);

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-person-btn');
        removeButton.textContent = 'Remove';
        removeButton.dataset.memberId = member._id; // Store the unique ID
        removeButton.onclick = (event) => {
            event.stopPropagation(); // Prevent tile click
            if (confirm(`Are you sure you want to remove ${member.Name || 'this member'}?`)) {
                const success = window.teamDataManager.deleteMemberById(member._id);
                if (success) {
                    alert(`${member.Name || 'Member'} removed. Data is updated in memory.`);
                    window.teamDataManager.refreshView(); // Refresh the current view
                } else {
                    alert(`Could not remove ${member.Name || 'this member'}.`);
                }
            }
        };
        adminButtonsDiv.appendChild(removeButton);
        tile.appendChild(adminButtonsDiv);


        // Click event to show modal (ensure it doesn't trigger if admin buttons are clicked)
        tile.addEventListener('click', (event) => {
            // Check if the click target is one of the admin buttons or their container
            if (event.target.closest('.tile-admin-buttons')) {
                return; // Do nothing if an admin button was clicked
            }
            showModal(member);
        });

        return tile;
    }

    /**
     * Generates initials from a name string.
     * @param {string} name - The full name.
     * @returns {string} The initials.
     */
    function getInitials(name) {
        if (!name || typeof name !== 'string') return '??';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
        } else if (parts.length === 1 && parts[0].length > 0) {
            return parts[0].charAt(0).toUpperCase() + (parts[0].length > 1 ? parts[0].charAt(1).toLowerCase() : '');
        }
        return '??';
    }

    // --- MODAL HANDLING ---

    /**
     * Shows the modal with detailed information for a team member.
     * @param {object} member - The team member's data.
     */
    function showModal(member) {
        if (!modal || !modalDetailsContainer) {
            console.error("Modal elements not found!");
            return;
        }

        const imageName = member.Name ? member.Name.toLowerCase().replace(/\s+/g, '_') + '.jpg' : 'default.jpg';
        const imageSrc = IMAGE_BASE_PATH + (member.PhotoFile || imageName);
        
        let imageElementHtml = `<img src="${imageSrc}" alt="${member.Name || 'Team Member'}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        imageElementHtml += `<div class="image-placeholder" style="display:none;">${getInitials(member.Name || 'TM')}</div>`;
        // The onerror for modal image directly manipulates style to show placeholder if image fails.

        modalDetailsContainer.innerHTML = `
            ${imageElementHtml}
            <h2 class="name">${member.Name || 'N/A'}</h2>
            <p class="role">${member.Role || 'N/A'}</p>
            <p><strong>Work Location:</strong> ${member.Location || 'N/A'}</p>
            <p><strong>Role in Parkland Org Chart:</strong> ${member['Role in the Parkland Org Chart'] || member.Role || 'N/A'}</p>
            <p><strong>Bio:</strong> ${member.Bio || 'N/A'}</p>
            <p><strong>Preferred Ways of Working:</strong> ${member['Working Style'] || member['Preferred Ways of Working'] || 'N/A'}</p>
            <p><strong>Fun Fact / Hobby:</strong> ${member['Fun Fact'] || member['Fun Fact / Hobby'] || 'N/A'}</p>
            <!-- To update image for [${member.Name}], ensure '${member.PhotoFile || imageName}' exists in '${IMAGE_BASE_PATH}' or update 'PhotoFile' in JSON. -->
        `;
        modal.style.display = 'block';
    }

    // Close modal when the close button is clicked
    if (modalCloseButton) {
        modalCloseButton.onclick = () => {
            if (modal) modal.style.display = 'none';
        };
    }

    // Close modal when clicking outside of the modal content
    window.onclick = (event) => {
        if (event.target === modal && modal) {
            modal.style.display = 'none';
        }
    };

    // --- INITIALIZATION ---

    /**
     * Initializes the people page by fetching data, creating tabs, and displaying the first workstream.
     */
    async function initializePage() {
        createTabs(); // Create tabs first, unconditionally.
        const activeTabButton = document.querySelector('.tab-button.active'); // Get the active tab set by createTabs

        try {
            await fetchTeamData(); // Fetches and sets global allTeamMembers

            // Determine which workstream to display
            let workstreamToDisplay = null;
            if (activeTabButton && activeTabButton.dataset.workstream) {
                workstreamToDisplay = activeTabButton.dataset.workstream;
            } else if (WORKSTREAMS_CONFIG.length > 0) {
                workstreamToDisplay = WORKSTREAMS_CONFIG[0].key;
                // If no tab was active, make the first one active visually if buttons exist
                const firstButton = document.querySelector('.tab-button');
                if (firstButton && !activeTabButton) firstButton.classList.add('active');
            }

            if (workstreamToDisplay) {
                // Check if allTeamMembers is populated correctly before trying to display
                if (Array.isArray(allTeamMembers) && allTeamMembers.length > 0) {
                    displayWorkstream(workstreamToDisplay);
                } else {
                    // This means fetchTeamData might have succeeded but returned no data,
                    // or it failed and allTeamMembers is still its initial empty array.
                    // The catch block below will handle explicit fetch errors.
                    // This handles the case of valid, but empty, data, or if fetchTeamData returned empty due to an error it handled internally (though it now re-throws).
                    teamContentArea.innerHTML = `<p>No team member data found for ${workstreamToDisplay} or data could not be loaded.</p>`;
                }
            } else {
                teamContentArea.innerHTML = "<p>No workstreams configured or active to display.</p>";
            }

        } catch (error) {
            // This catch block is for errors thrown by fetchTeamData or other issues during initialization.
            console.error('Initialization failed:', error);
            if (teamContentArea) { // Check if teamContentArea is available
                teamContentArea.innerHTML = `<p>Error initializing page content: ${error.message}. Tabs should be visible, but data could not be loaded. Please check the browser console and the data file (${DATA_FILE_PATH}).</p>`;
            } else {
                console.error("Critical error: teamContentArea not found during error reporting for initialization failure.");
            }
            // Even if data fails, ensure some tab is visually active if tabs exist and one wasn't already.
            if (!document.querySelector('.tab-button.active') && WORKSTREAMS_CONFIG.length > 0) {
                const firstButton = document.querySelector('.tab-button');
                if (firstButton) firstButton.classList.add('active');
            }
        }
    }

    initializePage(); // Start the process
});
