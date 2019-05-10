import * as md5
    from 'blueimp-md5';
// 1、es6 或 ts 引用方式
import {
    APPKEY_TEST, // nobook内部使用,对接的小伙伴不需引入
    APPSECRET_TEST, // nobook内部使用,对接的小伙伴不需引入
    AdditionalSDK,
    PID_TYPE,
    MESSAGE_TYPE
} from '@nobook/nobook-saas-sdk/nobook/additional';
/*
2、页面直接引用方式
<script src="lab.min.js"></script>
并通过 window 提取 NB_SDK_LAB
const {
    LabSDK,
    MESSAGE_TYPE,
    PID_TYPE
} = window.NB_SDK_LAB;
3、es5引用方式
const NBSDK = require('nobook-saas-sdk/lab.min.js');
 */
import {
    SECRET_DATA,
    getServerData
} from './server';

/**
 * 此页面为加试对接demo
 * 打开此页面会执行自动登录
 */
class main {

    constructor() {
        this.addSDK = new AdditionalSDK();
        /** ************************************************************
         *                              账户信息
         ************************************************************* */
        // 需传入信息
        this.uniqueId = 'test5'; // 用户账户,必填
        this.labId = ''; // 实验id,列表接口获取,在预览与编辑时需传入
        this.pidType = PID_TYPE.PHYSICAL_ADD; // 产品标识,nobook提供
        /** ************************************************************
         *                              第一步: 页面加载完成初始化
         ************************************************************* */
        $(() => {
            // 考试阶段通知部分
            this.addSDK.addListener(MESSAGE_TYPE.NOBOOK_ONE_STEP_CORRECT, (evt) => {
                console.log('-->考试模式反馈消息~~~~~考试单步骤正确:', evt.data);
                layer.msg('考试单步骤正确: ' + evt.data.params.msg);
            });
            this.addSDK.addListener(MESSAGE_TYPE.NOBOOK_ONE_STEP_WRONG, (evt) => {
                console.log('-->考试模式反馈消息~~~~~考试单步骤错误:', evt.data);
                layer.msg('考试单步骤错误: ' + evt.data.params.msg);
            });
            // 练习阶段通知部分
            this.addSDK.addListener(MESSAGE_TYPE.NOBOOK_PRACICE_ONE_TITLE, (evt) => {
                console.log('~~~~~练习模式-步骤标题:', evt.data);
            });
            this.addSDK.addListener(MESSAGE_TYPE.NOBOOK_PRACICE_ONE_COMPLETE, (evt) => {
                console.log('~~~~~练习模式-练习完成:', evt.data);
            });
            this.addSDK.addListener(MESSAGE_TYPE.NOBOOK_PRACICE_ONE_PROGRESS, (evt) => {
                console.log('~~~~~练习模式-练习当前进度:', evt.data);
            });
            // 先添加设置
            this.addSDK.setConfig({
                // 登录部分(所有操作必须登陆后执行)
                // DEBUG: true,
                // EXAM_VIEW_HOST_DEBUG: 'http://192.168.5.110:3333',
                // EXAM_VIEW_HOST_DEBUG: ' http://192.168.190.1:8080',
                // EXAM_VIEW_HOST_DEBUG: 'http://examphysplayer.nobook.cc',
                // ICON_HOST_PHYSICAL_DEBUG: 'http://addphys.nobook.cc/v1/assets/physics',
                pidType: this.pidType,
                appKey: SECRET_DATA.appKey, // nobook 提供
                from: '网校'
            });
            // ------------nobook内部测试用,对接的小伙伴可忽略此判断------------//
            if (this.addSDK.DEBUG) {
                SECRET_DATA.appKey = APPKEY_TEST;
                SECRET_DATA.appSecret = APPSECRET_TEST;
                this.addSDK.appKey = SECRET_DATA.appKey;
            }
            // ------------nobook内部测试用end------------//
            this.init();
            this.login();
        });
    }

    login() {
        // 登录部分(所有操作必须登陆后执行)
        // pidScope 登录授权的产品id
        const pidScope = this.addSDK.getAllLabPidScope(); // 用逗号隔开的产品id
        const nickname = this.uniqueId; // 这一项为用户昵称,此demo中用 uniqueId 代替
        const {timestamp, sign} = getServerData(this.uniqueId, nickname, pidScope);
        return this.addSDK.login({
            uniqueId: this.uniqueId,
            nickname: nickname,
            timestamp,
            sign,
            pidScope
        }).then((data) => {
            console.log('~登录成功:', data);
            $('.ni-cla').text('已登录: ' + this.addSDK.nickname);
            return 1;
        });
    }

    loginout() {
        this.addSDK.logout().then((data) => {
            $('.ni-cla').text('未登录');
            console.log('~退出成功:', data);
        }).catch((err) => {
            console.warn(err);
        });
    }

    /** ************************************************************
     *                              demo页面内存操作部分
     ************************************************************* */
    /**
     * 初始化
     */
    init() {
        this.addLeftBtns();
    }

    addLeftBtns() {
        // 登录按钮
        $('.use-cla').val(this.uniqueId);
        //
        $('.click-btns').off('click');
        $('.click-btns').click((evt) => {
            switch ($(evt.target).text()) {
                case '实验列表':
                    this.freshRightBox();
                    break;
                case '发布考试':
                    const idArr = [];
                    for (let item of $('input[name="sourceItem"]:checked')) {
                        idArr.push($(item).val());
                    }
                    this.publishExam(idArr);
                    break;
                case '发布考试列表':
                    $('.right-box').empty();
                    this.addSDK.pubLishList().then((obj) => {
                        console.log('~~发布考试列表:', obj);
                        obj.data.reverse().forEach((item) => {
                            $('.right-box').append($(this.getExamItem(
                                item.exam_id, item.exam_name, item.course_list.length,
                                item.course_list, item.exam_sn)));
                        });
                        this.freshBtnHandles();
                    });
                    break;
                case '退出':
                    // 执行退出
                    $('.login-btn').text('登录');
                    $('.use-cla').val('');
                    this.loginout();
                    break;
                case '登录':
                    // 执行登录
                    let uniqueId = $('.use-cla').val();
                    uniqueId = uniqueId.replace(/(^\s*)|(\s*$)/g, '');
                    if (uniqueId.length) {
                        $('.login-btn').text('退出');
                        this.uniqueId = uniqueId;
                        this.login();
                    }
                    break;
                case '返回':
                    this.clearIframe($('#viewIframeId')[0]);
                    $('#exam-lab').hide();
                    if (this.tempUniqueId) {
                        this.switchLogin(this.tempUniqueId);
                        this.tempUniqueId = null;
                    }
                    break;
                case '提交':
                    if (this.tempUniqueId) {
                        this.switchLogin(this.tempUniqueId);
                        this.tempUniqueId = null;
                        this.addSDK.saveExam({
                            iframeWindow: $('#viewIframeId')[0].contentWindow,
                            examSn: this.temp_examSn,
                            timeLength: 1000 // 单位秒
                        }).then((result) => {
                            console.log('*************提交成功返回结果:', result);
                            layer.msg('提交成功!');
                        });
                    }
                    break;
                case '切换版本':
                    if ($('.ban-label').text() === '物理加试') {
                        $('.ban-label').text('化学加试');
                        this.addSDK.switchSubject({pidType: PID_TYPE.CHEMICAL_ADD});
                        $('.right-box').empty();
                    } else {
                        $('.ban-label').text('物理加试');
                        this.addSDK.switchSubject({pidType: PID_TYPE.PHYSICAL_ADD});
                        $('.right-box').empty();
                    }
                    break;
                default:
                    break;
            }
        });
        this.freshPublishExamBtnEnabled();
    }

    freshRightBox() {
        $('.right-box').empty();
        this.addSDK.getCourseList({page: 1, limit: 50}).then((obj) => {
            console.log('~~获取实验列表:', obj);
            obj.data.data.forEach((item) => {
                $('.right-box').append($(this.getSourceItem(item.course_id, item.name, item.thumbnailfull)).click((evt) => {
                    this.freshPublishExamBtnEnabled();
                }));
            });
            this.freshBtnHandles();
        });
    }

    switchLogin(uniqueId) {
        this.uniqueId = uniqueId;
        return this.login();
    }

    /**
     * 给页面按钮添加事件
     */
    freshBtnHandles() {
        // 获取实验详情
        $('.sourceInfoCla').off('click');
        $('.sourceInfoCla').click((evt) => {
            this.addSDK.getCourseInfo({
                courseId: evt.target.value
            }).then((obj) => {
                console.log(obj);
                let stepStr = '';
                obj.data.step.forEach((bitStemItem, ind1) => {
                    // 大步骤
                    stepStr += `
                                   ${ind1}： ${bitStemItem.step_name}
                                `;
                    bitStemItem.itemStep.forEach((smallStemItem, ind2) => {
                        // 小步骤
                        stepStr += `
                                     ------- ${ind2}、 ${smallStemItem.step_name}     ->   <font style="color: red">${smallStemItem.score}分</font> <br>
                                    `;
                    });
                });
                layer.open({
                    title: `${obj.data.info.name}`,
                    type: 1,
                    skin: 'layui-layer-rim',
                    area: ['800px', '400px'],
                    content: `
                        实验名称: <br>${obj.data.info.name}<br><br>
                        实验步骤:<br>
                        ${stepStr}
                    `
                });
            });
        });
        // 老师参加考试与练习
        $('.teacher-start').off('click');
        $('.teacher-start').click((evt) => {
            $('#exam-submit-btn').hide(); // 教师端不需要提交
            $('#exam-lab').show(); // 显示实验面板
            const courseId = evt.target.value;
            const isexam = $(evt.target).text() === '参加考试' ? 1 : 0;
            const url = this.addSDK.getExamViewURL({
                courseId,
                isexam
            });
            console.log('预览:', url);
            $('#viewIframeId').attr('src', url);
        });
        // 学生端:打开实验,开始考试
        $('.stu-start-cla').off('click');
        $('.stu-start-cla').click((evt) => {
            const stuUniqueId = $(evt.target).siblings('input').val(); // 要考试的学生
            if (!stuUniqueId.length) {
                layer.msg('请输入需要参加考试的学生id');
                return;
            }
            //
            $('#exam-lab').show(); // 显示实验面板
            const isexam = $(evt.target).text() === '参加考试' ? 1 : 0;
            // 学生端考试模式需要提交
            if (isexam) {
                $('#exam-submit-btn').show();
            } else {
                $('#exam-submit-btn').hide();
            }
            this.tempUniqueId = this.uniqueId;
            const stuArr = evt.target.value.split('#'); // 要考试的学生
            const courseId = stuArr[0];
            this.temp_examSn = stuArr[1]; // 提交时用
            // 切换到该学生进行考试
            this.switchLogin(stuUniqueId).then(() => {
                // isexam: 1为考试,0为练习
                const url = this.addSDK.getExamViewURL({
                    courseId,
                    isexam
                });
                console.log('~~~url:', url);
                $('#viewIframeId').attr('src', url);
            });
        });
        // 获取考试实验下的学生列表
        $('.stu-list-btn').off('click');
        $('.stu-list-btn').click((evt) => {
            const arr = evt.target.value.split('#');
            const courseRelationId = arr[0];
            const examSn = arr[1];
            this.addSDK.getStudentExamList({
                examSn: examSn,
                courseRelationId: courseRelationId
            }).then((obj) => {
                console.log('~~获取考试实验下的学生列表:', obj);
                let liStr = '';
                obj.data.data.forEach((stuObj) => {
                    liStr += `
                        <li>
                            <button class="stu-result-btn click-btns" value="${stuObj.test_id}">获取实验结果</button>
                            ${stuObj.nickname}
                        </li>
                    `;
                });
                const layerListId = layer.open({
                    title: `学生报考数量：${obj.data.data.length}`,
                    type: 1,
                    skin: 'layui-layer-rim',
                    area: ['600px', '300px'],
                    content: `
                        <ui>${liStr}</ui>
                    `
                });
                setTimeout(() => {
                    $('.stu-result-btn').off('click');
                    $('.stu-result-btn').click((evt) => {
                        // 获取实验结果
                        const testId = evt.target.value;
                        layer.close(layerListId);
                        this.addSDK.getStudentExamInfo({
                            testId: testId
                        }).then((dataObj) => {
                            console.log('~~dataObj:', dataObj);
                            let stepStr = '';
                            dataObj.data.steps.forEach((bitStemItem, ind1) => {
                                // 大步骤
                                stepStr += `
                                   ${ind1}： ${bitStemItem.step_name} -> 
                                   <font style="color: green">${bitStemItem.count_score}分</font> - 
                                   <font style="color: red">${bitStemItem.score}分</font><br>
                                `;
                                bitStemItem.itemStep.forEach((smallStemItem, ind2) => {
                                    // 小步骤
                                    stepStr += `
                                     ------- ${ind2}、 ${smallStemItem.step_name}     ->   <font style="color: red">${smallStemItem.score}分</font> <br>
                                    `;
                                });
                            });
                            layer.open({
                                title: '学生考试结果',
                                type: 1,
                                skin: 'layui-layer-rim',
                                area: ['800px', '400px'],
                                content: `
                                        考试时长: <font style="color: green">${dataObj.data.info.timelength}秒</font><br>
                                        考试得分: <font style="color: red">${dataObj.data.info.score}分</font><br>
                                        分步得分如下:<br><br>
                                        ${stepStr}
                                    `
                            });
                        });
                    });
                });
            });
        });
    }

    get isTeacher() {
        return $('.user-btn').text() === '切学生';
    }

    // 实验列表dom项
    getSourceItem(id, name, iconURL) {
        return `
            <div class="item" style="background-image: url(${iconURL});">
                <input type="checkbox" name="sourceItem" value="${id}"/>
                <button class="sourceInfoCla click-btns" value="${id}">获取详情</button>
                <button class="teacher-start click-btns" value="${id}">参加考试</button>
                <button class="teacher-start click-btns" value="${id}">参加练习</button>
                <div class="div-name">${name}</div>
            </div>
        `;
    }

    // 考试列表dom项
    getExamItem(id, name, courseListNums, liArr, examSn) {
        let liStr = '';
        liArr.forEach((item) => {
            liStr += `
                <li class="lab-li">
                    <div>${item.name} </div>
                    <button class="stu-list-btn" value="${item.course_relation_id}#${examSn}">获取学生列表</button>
                    <div style="display: inline-block">
                        <input placeholder="点击输入学生id" style="width: 150px;">
                        <button class="stu-start-cla" value="${item.course_id}#${examSn}">参加考试</button>
                        <button class="stu-start-cla" value="${item.course_id}#${examSn}">参加练习</button>
                    </div>
                </li>
                `;
        });
        return `
            <div class="exam-item">
                <ui class="exam-lab-list">${liStr}</ui>
                <div class="div-name">${name}</div>
            </div>
        `;
    }

    // 刷新发版按钮
    freshPublishExamBtnEnabled() {
        if ($('input[name="sourceItem"]:checked').length) {
            $('#publishExamId').attr('disabled', false);
        } else {
            $('#publishExamId').attr('disabled', 'disabled');
        }
    }

    // 发布考试
    publishExam(idArr) {
        const courseIds = idArr.join(',');
        console.log('~~~发布考试:', courseIds);
        this.addSDK.publishExam({
            examName: '考试_' + new Date().getTime(),
            courseIds: courseIds
        }).then((data) => {
            console.log('发布考试:', data);
            layer.msg('发布完成');
            this.freshRightBox();
            this.freshPublishExamBtnEnabled();
        });
    }

    clearIframe(iframe) {
        iframe.src = 'about:blank';
        try {
            iframe.contentWindow.document.write('');
            iframe.contentWindow.document.clear();
        } catch (e) {
        }
    }

}

new main();
