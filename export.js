// Function to download all tournament registrations
async function downloadRegistrations() {
    const downloadBtn = document.querySelector('.download-all-btn');
    const originalBtnText = downloadBtn.innerHTML;
    
    try {
        // Show loading state
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing download...';
        
        const response = await fetch('http://localhost:3000/api/registrations');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        const registrations = responseData.data || responseData;
        
        if (!registrations || !Array.isArray(registrations) || registrations.length === 0) {
            showNotification('No registrations found to download.', 'error');
            return;
        }

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('All Registrations');

        // Add headers with styling
        const headers = [
            'Tournament',
            'Team Name',
            'Team Leader',
            'Phone Number',
            'Email',
            'Player 2',
            'Player 3',
            'Player 4',
            'Player 5',
            'Registration Date'
        ];

        worksheet.addRow(headers);
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4500' }
            };

        // Add data
        registrations.forEach(reg => {
            worksheet.addRow([
                reg.tournamentTitle || 'N/A',
                reg.teamName || 'N/A',
                reg.teamLeader || 'N/A',
                reg.phoneNumber || 'N/A',
                reg.email || 'N/A',
                reg.player2 || 'N/A',
                reg.player3 || 'N/A',
                reg.player4 || 'N/A',
                reg.player5 || 'N/A',
                reg.registrationDate ? new Date(reg.registrationDate).toLocaleString() : 'N/A'
            ]);
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            column.width = Math.max(
                Math.max(...registrations.map(reg => 
                    Object.values(reg).map(val => 
                        val ? val.toString().length : 0
                    )
                ).flat()),
                headers.map(h => h.length)
            ) + 2;
        });

        // Generate and download the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all_registrations_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('Registrations downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading registrations:', error);
        showNotification('Error downloading registrations. Please try again.', 'error');
    } finally {
        // Restore button state
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalBtnText;
        }
    }
}

// Function to download registrations for a specific tournament
async function downloadTournamentRegistrations(tournamentId) {
    const downloadBtn = document.querySelector(`button[onclick="downloadTournamentRegistrations('${tournamentId}')"]`);
    const originalBtnText = downloadBtn ? downloadBtn.innerHTML : '';
    
    try {
        // Show loading state
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        const response = await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/registrations`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        const registrations = responseData.data || responseData;
        
        if (!registrations || !Array.isArray(registrations) || registrations.length === 0) {
            showNotification('No registrations found for this tournament.', 'error');
            return;
        }

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tournament Registrations');

        // Add headers with styling
        const headers = [
            'Team Name',
            'Team Leader',
            'Phone Number',
            'Email',
            'Player 2',
            'Player 3',
            'Player 4',
            'Player 5',
            'Registration Date'
        ];

        worksheet.addRow(headers);
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4500' }
        };

        // Add data
        registrations.forEach(reg => {
            worksheet.addRow([
                reg.teamName || 'N/A',
                reg.teamLeader || 'N/A',
                reg.phoneNumber || 'N/A',
                reg.email || 'N/A',
                reg.player2 || 'N/A',
                reg.player3 || 'N/A',
                reg.player4 || 'N/A',
                reg.player5 || 'N/A',
                reg.registrationDate ? new Date(reg.registrationDate).toLocaleString() : 'N/A'
            ]);
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            column.width = Math.max(
                Math.max(...registrations.map(reg => 
                    Object.values(reg).map(val => 
                        val ? val.toString().length : 0
                    )
                ).flat()),
                headers.map(h => h.length)
            ) + 2;
        });

        // Generate and download the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament_registrations_${tournamentId}_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('Tournament registrations downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading tournament registrations:', error);
        showNotification('Error downloading registrations. Please try again.', 'error');
    } finally {
        // Restore button state
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalBtnText;
        }
    }
}

// Function to show notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add notification styles if not already present
if (!document.getElementById('notification-styles')) {
const style = document.createElement('style');
    style.id = 'notification-styles';
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }

    .notification.success {
        background-color: #4CAF50;
    }

    .notification.error {
        background-color: #f44336;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 
} 